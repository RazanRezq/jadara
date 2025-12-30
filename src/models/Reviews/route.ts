import { Hono } from 'hono'
import { z } from 'zod'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Review from './reviewSchema'
import { authenticate, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'
import Notification from '@/models/Notifications/notificationSchema'
import Applicant from '@/models/Applicants/applicantSchema'
import Job from '@/models/Jobs/jobSchema'
import User from '@/models/Users/userSchema'
import { revalidatePath } from 'next/cache'

const createReviewSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    jobId: z.string().min(1, 'Job ID is required'),
    rating: z.number().min(1).max(5),
    decision: z.enum(['strong_hire', 'recommended', 'neutral', 'not_recommended', 'strong_no']),
    pros: z.array(z.string()).optional().default([]),
    cons: z.array(z.string()).optional().default([]),
    privateNotes: z.string().optional(),
    summary: z.string().optional(),
    skillRatings: z.record(z.string(), z.number().min(1).max(5)).optional(),
})

const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    decision: z.enum(['strong_hire', 'recommended', 'neutral', 'not_recommended', 'strong_no']).optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    privateNotes: z.string().optional(),
    summary: z.string().optional(),
    skillRatings: z.record(z.string(), z.number().min(1).max(5)).optional(),
})

const app = new Hono()

// Create or update review (upsert)
app.post('/submit', authenticate, async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()
        const user = getAuthUser(c)

        console.log('═══════════════════════════════════════════════')
        console.log('[Review Submit] STEP 1: User authenticated')
        console.log('  Reviewer:', user.name, `(${user.role})`)
        console.log('  User ID:', user.id)
        console.log('═══════════════════════════════════════════════')

        // CRITICAL FIX: Smart Job ID Lookup
        let { applicantId, jobId, rating, decision, pros, cons, privateNotes, summary, skillRatings } = body

        console.log('[Review Submit] STEP 2: Smart Job ID Resolution')
        console.log('  Received applicantId:', applicantId)
        console.log('  Received jobId:', jobId || 'MISSING')

        // Fetch applicant to validate & recover Job ID if missing
        const applicant = await Applicant.findById(applicantId).lean()
        if (!applicant) {
            console.error('[Review Submit] ❌ Applicant not found:', applicantId)
            return c.json({
                success: false,
                error: 'Applicant not found',
            }, 404)
        }

        // Smart Fallback: If frontend didn't send jobId, use the one from the applicant
        if (!jobId && applicant.jobId) {
            jobId = applicant.jobId.toString()
            console.log('  ✅ Recovered missing jobId from applicant:', jobId)
        }

        if (!jobId) {
            console.error('[Review Submit] ❌ Job ID is missing and cannot be recovered')
            return c.json({
                success: false,
                error: 'Job ID is missing and cannot be recovered from applicant',
            }, 400)
        }

        console.log('  ✅ Final jobId:', jobId)

        // Now validate with the resolved jobId
        const validation = createReviewSchema.safeParse({
            applicantId,
            jobId,
            rating,
            decision,
            pros,
            cons,
            privateNotes,
            summary,
            skillRatings
        })

        if (!validation.success) {
            console.error('[Review Submit] Validation failed:', validation.error.flatten().fieldErrors)
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }

        const validatedData = validation.data

        console.log('[Review Submit] STEP 3: Validation passed')
        console.log('  Applicant ID:', validatedData.applicantId)
        console.log('  Job ID:', validatedData.jobId)
        console.log('  Rating:', validatedData.rating)
        console.log('  Decision:', validatedData.decision)

        // Check if this is a new review (not an update)
        const existingReview = await Review.findOne({ applicantId: validatedData.applicantId, reviewerId: user.id })
        const isNewReview = !existingReview

        console.log('[Review Submit] STEP 4: Checking if new review')
        console.log('  Existing review found?', existingReview ? 'YES' : 'NO')
        console.log('  Is NEW review?', isNewReview ? '✅ YES' : '❌ NO (Update)')

        // Upsert - update if exists, create if not
        const review = await Review.findOneAndUpdate(
            { applicantId: validatedData.applicantId, reviewerId: user.id },
            {
                applicantId: validatedData.applicantId,
                jobId: validatedData.jobId,
                reviewerId: user.id,
                rating: validatedData.rating,
                decision: validatedData.decision,
                pros: validatedData.pros,
                cons: validatedData.cons,
                privateNotes: validatedData.privateNotes,
                summary: validatedData.summary,
                skillRatings: validatedData.skillRatings ? new Map(Object.entries(validatedData.skillRatings)) as any : undefined,
            },
            { upsert: true, new: true, runValidators: true }
        )

        console.log('[Review Submit] STEP 5: Review saved to database')
        console.log('  Review ID:', review._id.toString())

        // Only trigger notifications and status updates for NEW reviews
        if (isNewReview) {
            console.log('[Review Submit] STEP 6: Triggering side-effects (NEW REVIEW)')

            // 1. Fetch job details for notification (applicant already fetched above)
            console.log('  → Fetching job details...')
            const job = await Job.findById(validatedData.jobId).populate({ path: 'createdBy', model: User, select: 'name email role' }).lean()

            console.log('  → Job found?', job ? '✅ YES' : '❌ NO')

            // GATEKEEPER LOGIC: Role-based status transitions
            // Only REVIEWERS can move candidates from 'new' to 'evaluated'
            // ADMIN/SUPERADMIN reviews are audit badges only - they do NOT move the candidate

            console.log('[Review Submit] GATEKEEPER: Role-based status transition check')
            console.log(`  Reviewer Role: ${user.role}`)
            console.log(`  Current Candidate Status: ${applicant.status}`)

            // Safety check: Ensure role is defined before processing
            if (!user.role) {
                console.warn('[Review Submit] ⚠️ User role is undefined - skipping status transition')
            } else if (user.role === 'reviewer') {
                // REVIEWER: Only moves candidate if in 'new' status
                if (applicant.status === 'new') {
                    await Applicant.findByIdAndUpdate(validatedData.applicantId, {
                        status: 'evaluated',
                    })
                    console.log(`  ✅ REVIEWER moved candidate: new → evaluated`)
                } else if (['interviewing', 'hired', 'rejected'].includes(applicant.status)) {
                    // Prevent reviewers from downgrading candidates in advanced stages
                    console.log(`  ⚠️  REVIEWER cannot downgrade candidate (status: ${applicant.status})`)
                } else {
                    console.log(`  ℹ️  REVIEWER: Status not updated (current: ${applicant.status})`)
                }
            } else {
                // ADMIN/SUPERADMIN: Audit badge only - NO status update
                console.log(`  📋 ADMIN/SUPERADMIN: Review saved as audit badge (no status change)`)
                console.log(`  ℹ️  Candidate remains in status: ${applicant.status}`)
            }

            // 3. ISOLATED NOTIFICATION LOGIC (failures here won't crash review submission)
            if (job) {
                try {
                    const applicantName = applicant.personalData?.name || 'Unknown Candidate'
                    const jobTitle = job.title || 'Unknown Position'

                    console.log('  → Applicant:', applicantName)
                    console.log('  → Job:', jobTitle)

                    // --- TEAM BROADCAST LOGIC ---
                    console.log('[Notification] Starting Team Broadcast...')
                    const recipients = new Set<string>()

                    // Fetch ALL Active Team Members (Super Admin, Admin, Reviewer)
                    // Exclude the current sender ($ne: user.id) directly in DB query for efficiency
                    const teamMembers = await User.find({
                        role: { $in: ['superadmin', 'admin', 'reviewer'] },
                        isActive: true,
                        _id: { $ne: user.id } // Don't notify self
                    }).select('_id email role')

                    teamMembers.forEach(member => {
                        recipients.add(member._id.toString())
                    })

                    console.log(`[Notification] Broadcast target: ${recipients.size} members (Roles: SuperAdmin, Admin, Reviewer)`)
                    // ----------------------------

                    // Convert to ObjectId array
                    const uniqueRecipientIds = Array.from(recipients).map(
                        id => new mongoose.Types.ObjectId(id)
                    )

                    console.log('  → Total unique recipients:', uniqueRecipientIds.length)

                    // Create notifications for all recipients
                    if (uniqueRecipientIds.length > 0) {
                        const notificationData = uniqueRecipientIds.map(recipientId => ({
                            userId: recipientId,
                            type: 'review_completed' as const,
                            priority: 'high' as const,
                            title: 'New Review Submitted',
                            message: `${user.name} has evaluated ${applicantName} for ${jobTitle}. Rating: ${validatedData.rating}/5`,
                            actionUrl: `/dashboard/applicants?open=${validatedData.applicantId}&tab=review`,
                            relatedId: new mongoose.Types.ObjectId(validatedData.applicantId),
                        }))

                        console.log('  → Creating notifications for', uniqueRecipientIds.length, 'recipients')
                        const createdNotifications = await Notification.insertMany(notificationData)
                        console.log('  ✅ Created', createdNotifications.length, 'notifications successfully')
                    } else {
                        console.warn('  ⚠️  No recipients found - notifications NOT sent')
                    }
                } catch (notifError) {
                    // CRITICAL: Notification failure doesn't crash review submission
                    console.error('  ❌ Notification failed, but review was saved successfully:', notifError)
                    console.error('  Notification error details:', notifError instanceof Error ? notifError.message : 'Unknown error')
                }
            } else {
                console.warn('  ⚠️  Job not found - skipping notifications (review still saved)')
            }

            // 4. Revalidate paths for real-time UI updates
            console.log('  → Revalidating UI paths...')
            revalidatePath('/dashboard/applicants')
            revalidatePath('/dashboard')
            revalidatePath(`/dashboard/applicants/${validatedData.applicantId}`)
            console.log('  ✅ UI paths revalidated')
        } else {
            console.log('[Review Submit] STEP 6: Skipping side-effects (UPDATE, not NEW)')
        }

        console.log('[Review Submit] STEP 7: Logging user action')
        await logUserAction(
            user,
            'review.submitted',
            'Review',
            review._id.toString(),
            `${isNewReview ? 'Submitted' : 'Updated'} review for applicant ${validatedData.applicantId} with rating ${validatedData.rating}/5`,
            {
                metadata: {
                    applicantId: validatedData.applicantId,
                    jobId: validatedData.jobId,
                    rating: validatedData.rating,
                    decision: validatedData.decision,
                    isNewReview,
                },
                severity: 'info',
            }
        )

        console.log('[Review Submit] STEP 8: SUCCESS! Returning response')
        console.log('═══════════════════════════════════════════════')
        return c.json({
            success: true,
            message: isNewReview ? 'Review submitted successfully' : 'Review updated successfully',
            review: {
                id: review._id.toString(),
                rating: review.rating,
                decision: review.decision,
            },
        })
    } catch (error) {
        console.error('═══════════════════════════════════════════════')
        console.error('[Review Submit] ❌ ERROR OCCURRED')
        console.error('  Error:', error)
        console.error('  Message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('  Stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('═══════════════════════════════════════════════')

        // Handle duplicate key error (shouldn't happen with upsert, but just in case)
        if ((error as any).code === 11000) {
            return c.json({
                success: false,
                error: 'You have already reviewed this applicant',
            }, 409)
        }

        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get reviews for an applicant
app.get('/by-applicant/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const user = getAuthUser(c)

        console.log('[Get Reviews] Fetching reviews for applicant:', applicantId)
        const reviews = await Review.find({ applicantId })
            .populate({ path: 'reviewerId', model: User, select: 'name email role' })
            .sort({ createdAt: -1 })
            .lean()

        console.log('[Get Reviews] Found', reviews.length, 'reviews (before filtering)')

        // CRITICAL FIX: Filter out orphaned reviews (where reviewer was deleted)
        const validReviews = reviews.filter(review => {
            // Check if reviewer exists (not null) AND has required fields
            const isValid = review.reviewerId &&
                           typeof review.reviewerId === 'object' &&
                           '_id' in review.reviewerId

            if (!isValid) {
                console.warn('[Get Reviews] ⚠️  Skipping orphaned review:', {
                    reviewId: review._id.toString(),
                    reviewerId: review.reviewerId,
                    issue: 'Reviewer user was deleted or populate failed'
                })
            }

            return isValid
        })

        console.log('[Get Reviews] Valid reviews after filtering:', validReviews.length)
        if (validReviews.length < reviews.length) {
            console.warn('[Get Reviews] ⚠️  Filtered out', reviews.length - validReviews.length, 'orphaned reviews')
        }

        // For reviewers, hide private notes from other reviewers
        const isReviewer = user.role === 'reviewer'

        return c.json({
            success: true,
            reviews: validReviews.map((r) => ({
                id: r._id.toString(),
                rating: r.rating,
                decision: r.decision,
                pros: r.pros,
                cons: r.cons,
                // Only show private notes if it's the author or if user is admin+
                privateNotes: (!isReviewer || (r.reviewerId as any)._id.toString() === user.id) ? r.privateNotes : undefined,
                summary: r.summary,
                skillRatings: r.skillRatings instanceof Map
                    ? Object.fromEntries(r.skillRatings)
                    : r.skillRatings,
                reviewer: {
                    id: (r.reviewerId as any)._id.toString(),
                    name: (r.reviewerId as any).name,
                    email: (r.reviewerId as any).email,
                    role: (r.reviewerId as any).role,
                },
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
        })
    } catch (error) {
        console.error('[Get Reviews] ERROR:', error)
        console.error('[Get Reviews] Error details:', error instanceof Error ? error.message : 'Unknown error')
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get my review for an applicant
app.get('/my-review/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const user = getAuthUser(c)

        const review = await Review.findOne({ applicantId, reviewerId: user.id }).lean()

        if (!review) {
            return c.json({
                success: true,
                review: null,
            })
        }

        return c.json({
            success: true,
            review: {
                id: review._id.toString(),
                rating: review.rating,
                decision: review.decision,
                pros: review.pros,
                cons: review.cons,
                privateNotes: review.privateNotes,
                summary: review.summary,
                skillRatings: review.skillRatings instanceof Map
                    ? Object.fromEntries(review.skillRatings)
                    : review.skillRatings,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            },
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get average rating for an applicant
app.get('/average/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')

        const result = await Review.aggregate([
            { $match: { applicantId: new mongoose.Types.ObjectId(applicantId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    // Count decisions
                    strongHire: { $sum: { $cond: [{ $eq: ['$decision', 'strong_hire'] }, 1, 0] } },
                    recommended: { $sum: { $cond: [{ $eq: ['$decision', 'recommended'] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ['$decision', 'neutral'] }, 1, 0] } },
                    notRecommended: { $sum: { $cond: [{ $eq: ['$decision', 'not_recommended'] }, 1, 0] } },
                    strongNo: { $sum: { $cond: [{ $eq: ['$decision', 'strong_no'] }, 1, 0] } },
                },
            },
        ])

        const stats = result[0] || {
            averageRating: 0,
            totalReviews: 0,
            strongHire: 0,
            recommended: 0,
            neutral: 0,
            notRecommended: 0,
            strongNo: 0,
        }

        return c.json({
            success: true,
            stats: {
                averageRating: Math.round(stats.averageRating * 10) / 10,
                totalReviews: stats.totalReviews,
                decisions: {
                    strongHire: stats.strongHire,
                    recommended: stats.recommended,
                    neutral: stats.neutral,
                    notRecommended: stats.notRecommended,
                    strongNo: stats.strongNo,
                },
            },
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Update my review
app.post('/update/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const user = getAuthUser(c)

        const validation = updateReviewSchema.safeParse(body)
        if (!validation.success) {
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }

        const review = await Review.findById(id)
        if (!review) {
            return c.json({ success: false, error: 'Review not found' }, 404)
        }

        // Only the author can update their review
        if (review.reviewerId.toString() !== user.id) {
            return c.json({ success: false, error: 'Unauthorized to update this review' }, 403)
        }

        Object.assign(review, validation.data)
        if (validation.data.skillRatings) {
            review.skillRatings = new Map(Object.entries(validation.data.skillRatings)) as any
        }
        await review.save()

        await logUserAction(
            user,
            'review.updated',
            'Review',
            review._id.toString(),
            `Updated review ${id}`,
            { severity: 'info' }
        )

        return c.json({
            success: true,
            message: 'Review updated successfully',
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get reviewer's submission stats
app.get('/my-stats', authenticate, async (c) => {
    try {
        await dbConnect()
        const user = getAuthUser(c)

        const [totalReviews, recentReviews] = await Promise.all([
            Review.countDocuments({ reviewerId: user.id }),
            Review.find({ reviewerId: user.id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({ path: 'applicantId', model: Applicant, select: 'personalData.name' })
                .lean(),
        ])

        return c.json({
            success: true,
            stats: {
                totalReviews,
                recentReviews: recentReviews.map((r) => ({
                    id: r._id.toString(),
                    applicantName: (r.applicantId as any)?.personalData?.name || 'Unknown',
                    rating: r.rating,
                    decision: r.decision,
                    createdAt: r.createdAt,
                })),
            },
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Batch get reviewer badges for multiple applicants (for Kanban board display)
app.post('/batch-badges', authenticate, async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()
        const { applicantIds } = body

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return c.json({
                success: true,
                reviewsByApplicant: {},
            })
        }

        // Fetch all reviews for the given applicants with reviewer info
        const reviews = await Review.find({
            applicantId: { $in: applicantIds.map(id => new mongoose.Types.ObjectId(id)) }
        })
            .populate({ path: 'reviewerId', model: User, select: 'name role' })
            .lean()

        // Group reviews by applicant ID
        const reviewsByApplicant: Record<string, Array<{
            reviewerId: string
            reviewerName: string
            reviewerRole: string
            rating: number
            decision: string
        }>> = {}

        for (const review of reviews) {
            const applicantId = review.applicantId.toString()
            if (!reviewsByApplicant[applicantId]) {
                reviewsByApplicant[applicantId] = []
            }

            // Only include if reviewer exists (not deleted)
            if (review.reviewerId && typeof review.reviewerId === 'object' && '_id' in review.reviewerId) {
                reviewsByApplicant[applicantId].push({
                    reviewerId: (review.reviewerId as any)._id.toString(),
                    reviewerName: (review.reviewerId as any).name || 'Unknown',
                    reviewerRole: (review.reviewerId as any).role || 'reviewer',
                    rating: review.rating,
                    decision: review.decision,
                })
            }
        }

        return c.json({
            success: true,
            reviewsByApplicant,
        })
    } catch (error) {
        console.error('[Batch Badges] Error:', error)
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get rating distribution for a specific reviewer
app.get('/rating-distribution', authenticate, async (c) => {
    try {
        await dbConnect()
        const reviewerId = c.req.query('reviewerId')
        const user = getAuthUser(c)

        // Use current user if reviewerId not provided or if non-admin trying to view others
        const targetReviewerId = reviewerId && (user.role === 'admin' || user.role === 'superadmin')
            ? reviewerId
            : user.id

        const result = await Review.aggregate([
            {
                $match: {
                    reviewerId: new mongoose.Types.ObjectId(targetReviewerId),
                },
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: -1 },
            },
        ])

        // Transform result to ensure all star ratings are present
        const distribution = [5, 4, 3, 2, 1].map((rating) => {
            const found = result.find((r) => r._id === rating)
            return {
                rating,
                count: found?.count || 0,
            }
        })

        const total = distribution.reduce((acc, item) => acc + item.count, 0)

        return c.json({
            success: true,
            data: {
                distribution,
                total,
            },
        })
    } catch (error) {
        console.error('[Rating Distribution] Error:', error)
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

export default app
