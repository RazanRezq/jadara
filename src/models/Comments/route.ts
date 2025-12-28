import { Hono } from 'hono'
import { z } from 'zod'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Comment from './commentSchema'
import User from '@/models/Users/userSchema'
import Applicant from '@/models/Applicants/applicantSchema'
import Notification from '@/models/Notifications/notificationSchema'
import { authenticate, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'

const createCommentSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment is too long'),
    isPrivate: z.boolean().optional().default(false),
})

const updateCommentSchema = z.object({
    content: z.string().min(1).max(2000).optional(),
    isPrivate: z.boolean().optional(),
})

const app = new Hono()

// Create comment
app.post('/create', authenticate, async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()
        const user = getAuthUser(c)

        console.log('[Comment Create] Step 1: User authenticated:', user.id, user.name)
        console.log('[Comment Create] Step 2: Request body:', body)

        const validation = createCommentSchema.safeParse(body)
        if (!validation.success) {
            console.error('[Comment Create] Validation failed:', validation.error.flatten().fieldErrors)
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }

        const { applicantId, content, isPrivate } = validation.data
        console.log('[Comment Create] Step 3: Validation passed. Creating comment...')

        // Convert string IDs to ObjectId
        const comment = new Comment({
            applicantId: new mongoose.Types.ObjectId(applicantId),
            authorId: new mongoose.Types.ObjectId(user.id),
            content,
            isPrivate,
        })

        console.log('[Comment Create] Step 4: Saving comment to database...')
        await comment.save()
        console.log('[Comment Create] Step 5: Comment saved successfully:', comment._id.toString())

        // --- TEAM BROADCAST NOTIFICATION LOGIC ---
        try {
            console.log('[Comment Notification] Starting Team Broadcast...')

            // 1. Fetch Applicant Name
            const applicant = await Applicant.findById(applicantId).select('personalData').lean()
            console.log('[Comment Notification] Applicant lookup result:', applicant ? 'Found' : 'Not found')

            if (applicant) {
                const applicantName = applicant.personalData?.name || 'Unknown Candidate'
                console.log('[Comment Notification] Applicant name:', applicantName)

                // 2. Find Team Members (Broadcast) - Convert user.id to ObjectId for proper comparison
                const currentUserId = new mongoose.Types.ObjectId(user.id)
                const teamMembers = await User.find({
                    role: { $in: ['superadmin', 'admin', 'reviewer'] },
                    isActive: true,
                    _id: { $ne: currentUserId } // Exclude sender (proper ObjectId comparison)
                }).select('_id')

                console.log(`[Comment Notification] Targeting ${teamMembers.length} team members`)

                if (teamMembers.length > 0) {
                    const notifications = teamMembers.map(member => ({
                        userId: member._id,
                        type: 'comment_added' as const,
                        priority: 'medium' as const,
                        title: 'New Team Note',
                        message: `${user.name} added a note for ${applicantName}`,
                        actionUrl: `/dashboard/applicants?open=${applicantId}&tab=notes`,
                        relatedId: new mongoose.Types.ObjectId(applicantId),
                    }))

                    const createdNotifications = await Notification.insertMany(notifications)
                    console.log('[Comment Notification] ✅ Sent', createdNotifications.length, 'notifications successfully!')
                } else {
                    console.warn('[Comment Notification] ⚠️ No team members found to notify')
                }
            } else {
                console.warn('[Comment Notification] ⚠️ Applicant not found, skipping notifications')
            }
        } catch (notifError) {
            // CRITICAL: Notification failure doesn't crash comment creation
            console.error('[Comment Notification] ❌ Failed to send notifications:', notifError)
            console.error('[Comment Notification] Error details:', notifError instanceof Error ? notifError.message : 'Unknown error')
        }
        // -------------------------------------------

        await logUserAction(
            user,
            'comment.created',
            'Comment',
            comment._id.toString(),
            `Added comment on applicant ${applicantId}`,
            {
                metadata: { applicantId, isPrivate },
                severity: 'info',
            }
        )

        // Populate author for response
        console.log('[Comment Create] Step 6: Populating author...')
        await comment.populate({ path: 'authorId', model: User, select: 'name email role' })

        console.log('[Comment Create] Step 7: Success! Returning response.')
        return c.json({
            success: true,
            message: 'Comment added successfully',
            comment: {
                id: comment._id.toString(),
                content: comment.content,
                isPrivate: comment.isPrivate,
                author: {
                    id: (comment.authorId as any)._id.toString(),
                    name: (comment.authorId as any).name,
                    email: (comment.authorId as any).email,
                    role: (comment.authorId as any).role,
                },
                createdAt: comment.createdAt,
            },
        })
    } catch (error) {
        console.error('[Comment Create] ERROR:', error)
        console.error('[Comment Create] Error details:', error instanceof Error ? error.message : 'Unknown error')
        console.error('[Comment Create] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get comments for an applicant
app.get('/by-applicant/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const user = getAuthUser(c)

        console.log('[Get Comments] Fetching comments for applicant:', applicantId)

        // Build query - private comments only visible to author
        const query: any = {
            applicantId,
            $or: [
                { isPrivate: false },
                { isPrivate: true, authorId: user.id },
            ],
        }

        const comments = await Comment.find(query)
            .populate({ path: 'authorId', model: User, select: 'name email role' })
            .sort({ createdAt: -1 })
            .lean()

        console.log('[Get Comments] Found', comments.length, 'comments (before filtering)')

        // CRITICAL FIX: Filter out orphaned comments (where author was deleted)
        const validComments = comments.filter(comment => {
            // Check if author exists (not null) AND has required fields
            const isValid = comment.authorId &&
                           typeof comment.authorId === 'object' &&
                           '_id' in comment.authorId

            if (!isValid) {
                console.warn('[Get Comments] ⚠️  Skipping orphaned comment:', {
                    commentId: comment._id.toString(),
                    authorId: comment.authorId,
                    issue: 'Author user was deleted or populate failed'
                })
            }

            return isValid
        })

        console.log('[Get Comments] Valid comments after filtering:', validComments.length)
        if (validComments.length < comments.length) {
            console.warn('[Get Comments] ⚠️  Filtered out', comments.length - validComments.length, 'orphaned comments')
        }

        return c.json({
            success: true,
            comments: validComments.map((c) => ({
                id: c._id.toString(),
                content: c.content,
                isPrivate: c.isPrivate,
                author: {
                    id: (c.authorId as any)._id.toString(),
                    name: (c.authorId as any).name,
                    email: (c.authorId as any).email,
                    role: (c.authorId as any).role,
                },
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                isOwn: (c.authorId as any)._id.toString() === user.id,
            })),
        })
    } catch (error) {
        console.error('[Get Comments] ERROR:', error)
        console.error('[Get Comments] Error details:', error instanceof Error ? error.message : 'Unknown error')
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Update comment (only author can update)
app.post('/update/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const user = getAuthUser(c)

        const validation = updateCommentSchema.safeParse(body)
        if (!validation.success) {
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }

        const comment = await Comment.findById(id)
        if (!comment) {
            return c.json({ success: false, error: 'Comment not found' }, 404)
        }

        // Only the author can update their comment
        if (comment.authorId.toString() !== user.id) {
            return c.json({ success: false, error: 'Unauthorized to update this comment' }, 403)
        }

        if (validation.data.content) comment.content = validation.data.content
        if (validation.data.isPrivate !== undefined) comment.isPrivate = validation.data.isPrivate

        await comment.save()

        await logUserAction(
            user,
            'comment.updated',
            'Comment',
            comment._id.toString(),
            `Updated comment ${id}`,
            { severity: 'info' }
        )

        return c.json({
            success: true,
            message: 'Comment updated successfully',
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Delete comment (only author or admin can delete)
app.delete('/delete/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const user = getAuthUser(c)

        const comment = await Comment.findById(id)
        if (!comment) {
            return c.json({ success: false, error: 'Comment not found' }, 404)
        }

        // Only the author or admin+ can delete
        const isAuthor = comment.authorId.toString() === user.id
        const isAdmin = user.role === 'admin' || user.role === 'superadmin'

        if (!isAuthor && !isAdmin) {
            return c.json({ success: false, error: 'Unauthorized to delete this comment' }, 403)
        }

        await Comment.findByIdAndDelete(id)

        await logUserAction(
            user,
            'comment.deleted',
            'Comment',
            id,
            `Deleted comment ${id}`,
            { severity: 'warning' }
        )

        return c.json({
            success: true,
            message: 'Comment deleted successfully',
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get comment count for an applicant
app.get('/count/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const user = getAuthUser(c)

        const query: any = {
            applicantId,
            $or: [
                { isPrivate: false },
                { isPrivate: true, authorId: user.id },
            ],
        }

        const count = await Comment.countDocuments(query)

        return c.json({
            success: true,
            count,
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

export default app
