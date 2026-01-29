import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Interview from './interviewSchema'
import Applicant from '@/models/Applicants/applicantSchema'
import { authenticate, getAuthUser, requireRole } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'
import { sendInterviewInvite, type InterviewInviteData } from '@/lib/email'

const createInterviewSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    jobId: z.string().min(1, 'Job ID is required'),
    scheduledDate: z.string().min(1, 'Scheduled date is required'),
    scheduledTime: z.string().min(1, 'Scheduled time is required'),
    duration: z.number().min(15).max(240).optional().default(60),
    meetingLink: z.string().min(1, 'Meeting link is required'),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    sendEmail: z.boolean().optional().default(true),
})

const updateInterviewSchema = z.object({
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    duration: z.number().min(15).max(240).optional(),
    meetingLink: z.string().optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
})

const app = new Hono()

// Create interview (Admin only)
app.post('/create', authenticate, requireRole('admin'), async (c) => {
    try {
        console.log('🔹 Step 1: Connecting to database...')
        await dbConnect()

        console.log('🔹 Step 2: Parsing request body...')
        const body = await c.req.json()
        console.log('Request body:', JSON.stringify(body, null, 2))

        console.log('🔹 Step 3: Getting auth user...')
        const user = getAuthUser(c)
        console.log('Auth user:', user.id, user.email)

        console.log('🔹 Step 4: Validating input...')
        const validation = createInterviewSchema.safeParse(body)
        if (!validation.success) {
            console.error('❌ Validation failed:', validation.error.flatten().fieldErrors)
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }
        console.log('✅ Validation passed')

        const { applicantId, jobId, scheduledDate, scheduledTime, duration, meetingLink, notes, internalNotes, sendEmail: shouldSendEmail } = validation.data

        console.log('🔹 Step 5: Looking up applicant...')
        console.log('Applicant ID:', applicantId)
        // Check if applicant exists
        const applicant = await Applicant.findById(applicantId).populate('jobId', 'title')
        if (!applicant) {
            console.error('❌ Applicant not found')
            return c.json({ success: false, error: 'Applicant not found' }, 404)
        }
        console.log('✅ Applicant found:', applicant.personalData?.name)

        console.log('🔹 Step 6: Creating interview document...')
        // Create interview
        const interview = new Interview({
            applicantId,
            jobId,
            scheduledBy: user.id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            duration,
            meetingLink,
            notes,
            internalNotes,
            status: 'scheduled',
        })

        console.log('🔹 Step 7: Saving interview...')
        await interview.save()
        console.log('✅ Interview saved:', interview._id)

        console.log('🔹 Step 8: Updating applicant status...')
        // Update applicant status to interview (Golden List canonical name)
        applicant.status = 'interview'
        await applicant.save()
        console.log('✅ Applicant status updated to interview')

        const applicantName = applicant.personalData?.name || 'Unknown'
        const applicantEmail = applicant.personalData?.email || ''
        const jobTitle = applicant.jobId && typeof applicant.jobId === 'object' ? (applicant.jobId as any).title : 'Unknown'

        console.log('🔹 Step 9: Preparing email...')
        console.log('Should send email:', shouldSendEmail)
        console.log('Applicant email:', applicantEmail)
        // Send interview invite email
        let emailSent = false
        if (shouldSendEmail && applicantEmail) {
            console.log('🔹 Step 10: Sending email...')
            const emailData: InterviewInviteData = {
                candidateName: applicantName,
                jobTitle,
                interviewDate: new Date(scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                interviewTime: scheduledTime,
                meetingLink,
                notes,
            }

            const emailResult = await sendInterviewInvite(applicantEmail, emailData)
            emailSent = emailResult.success
            console.log('Email result:', emailSent ? '✅ Sent' : '❌ Failed')
        } else {
            console.log('⏭️ Skipping email send')
        }

        console.log('🔹 Step 11: Logging audit action...')
        // Log the action
        await logUserAction(
            user,
            'interview.scheduled',
            'Interview',
            interview._id.toString(),
            `Scheduled interview for ${applicantName} on ${scheduledDate} at ${scheduledTime}`,
            {
                resourceName: applicantName,
                metadata: {
                    applicantEmail,
                    jobTitle,
                    scheduledDate,
                    scheduledTime,
                    emailSent,
                },
                severity: 'info',
            }
        )
        console.log('✅ Audit log created')

        console.log('🔹 Step 12: Returning success response...')
        return c.json({
            success: true,
            message: 'Interview scheduled successfully',
            interview: {
                id: interview._id.toString(),
                scheduledDate: interview.scheduledDate,
                scheduledTime: interview.scheduledTime,
                meetingLink: interview.meetingLink,
                status: interview.status,
            },
            emailSent,
        })
    } catch (error) {
        console.error('❌ Interview creation error:', error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get interviews for an applicant (paginated)
app.get('/by-applicant/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')

        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '50')
        const skip = (page - 1) * limit

        const [interviews, total] = await Promise.all([
            Interview.find({ applicantId })
                .populate('scheduledBy', 'name email')
                .sort({ scheduledDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Interview.countDocuments({ applicantId }),
        ])

        return c.json({
            success: true,
            interviews: interviews.map((i) => ({
                id: i._id.toString(),
                scheduledDate: i.scheduledDate,
                scheduledTime: i.scheduledTime,
                duration: i.duration,
                meetingLink: i.meetingLink,
                notes: i.notes,
                status: i.status,
                scheduledBy: i.scheduledBy,
                createdAt: i.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
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

// Get upcoming interviews (for dashboard)
app.get('/upcoming', authenticate, async (c) => {
    try {
        await dbConnect()
        const limit = parseInt(c.req.query('limit') || '10')
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const interviews = await Interview.find({
            scheduledDate: { $gte: today },
            status: { $in: ['scheduled', 'confirmed'] },
        })
            .populate('applicantId', 'personalData.name personalData.email')
            .populate('jobId', 'title')
            .sort({ scheduledDate: 1, scheduledTime: 1 })
            .limit(limit)
            .lean()

        return c.json({
            success: true,
            interviews: interviews.map((i) => ({
                id: i._id.toString(),
                scheduledDate: i.scheduledDate,
                scheduledTime: i.scheduledTime,
                duration: i.duration,
                meetingLink: i.meetingLink,
                status: i.status,
                applicant: i.applicantId,
                job: i.jobId,
            })),
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Update interview
app.post('/update/:id', authenticate, requireRole('admin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const user = getAuthUser(c)

        const validation = updateInterviewSchema.safeParse(body)
        if (!validation.success) {
            return c.json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }, 400)
        }

        const interview = await Interview.findById(id)
        if (!interview) {
            return c.json({ success: false, error: 'Interview not found' }, 404)
        }

        const updates: Record<string, unknown> = {}
        if (validation.data.scheduledDate) updates.scheduledDate = new Date(validation.data.scheduledDate)
        if (validation.data.scheduledTime) updates.scheduledTime = validation.data.scheduledTime
        if (validation.data.duration) updates.duration = validation.data.duration
        if (validation.data.meetingLink) updates.meetingLink = validation.data.meetingLink
        if (validation.data.notes !== undefined) updates.notes = validation.data.notes
        if (validation.data.internalNotes !== undefined) updates.internalNotes = validation.data.internalNotes
        if (validation.data.status) updates.status = validation.data.status

        Object.assign(interview, updates)
        await interview.save()

        await logUserAction(
            user,
            'interview.updated',
            'Interview',
            interview._id.toString(),
            `Updated interview: ${id}`,
            {
                changes: { after: updates },
                severity: 'info',
            }
        )

        return c.json({
            success: true,
            message: 'Interview updated successfully',
            interview: {
                id: interview._id.toString(),
                scheduledDate: interview.scheduledDate,
                scheduledTime: interview.scheduledTime,
                status: interview.status,
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

// Cancel interview
app.post('/cancel/:id', authenticate, requireRole('admin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const user = getAuthUser(c)

        const interview = await Interview.findById(id)
        if (!interview) {
            return c.json({ success: false, error: 'Interview not found' }, 404)
        }

        interview.status = 'cancelled'
        await interview.save()

        await logUserAction(
            user,
            'interview.cancelled',
            'Interview',
            interview._id.toString(),
            `Cancelled interview: ${id}`,
            { severity: 'warning' }
        )

        return c.json({
            success: true,
            message: 'Interview cancelled successfully',
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get interview count (for stats)
app.get('/count', authenticate, async (c) => {
    try {
        await dbConnect()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [upcoming, completed] = await Promise.all([
            Interview.countDocuments({
                scheduledDate: { $gte: today },
                status: { $in: ['scheduled', 'confirmed'] },
            }),
            Interview.countDocuments({ status: 'completed' }),
        ])

        return c.json({
            success: true,
            counts: { upcoming, completed },
        })
    } catch (error) {
        return c.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

// Get interviews by date range (for calendar view, paginated)
app.get('/by-date-range', authenticate, async (c) => {
    try {
        await dbConnect()

        const start = c.req.query('start')
        const end = c.req.query('end')
        const status = c.req.query('status')
        const jobId = c.req.query('jobId')
        const scheduledBy = c.req.query('scheduledBy')
        const search = c.req.query('search')

        if (!start || !end) {
            return c.json({
                success: false,
                error: 'Start and end dates are required',
            }, 400)
        }

        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '50')
        const skip = (page - 1) * limit

        // Build query
        const query: Record<string, unknown> = {
            scheduledDate: {
                $gte: new Date(start),
                $lte: new Date(end),
            },
        }

        if (status && status !== 'all') {
            query.status = { $in: status.split(',') }
        }
        if (jobId && jobId !== 'all') {
            query.jobId = jobId
        }
        if (scheduledBy && scheduledBy !== 'all') {
            query.scheduledBy = scheduledBy
        }

        const [rawInterviews, total] = await Promise.all([
            Interview.find(query)
                .populate('applicantId', 'personalData.name personalData.email')
                .populate('jobId', 'title')
                .populate('scheduledBy', 'name email')
                .sort({ scheduledDate: 1, scheduledTime: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Interview.countDocuments(query),
        ])

        // Filter by candidate name if search term provided (applied within current page)
        const interviews = search
            ? rawInterviews.filter((i: any) =>
                  i.applicantId?.personalData?.name
                      ?.toLowerCase()
                      .includes(String(search).toLowerCase())
              )
            : rawInterviews

        // Transform to frontend format
        const transformedInterviews = interviews.map((i: any) => ({
            id: i._id.toString(),
            applicantId: i.applicantId?._id.toString() || '',
            applicantName: i.applicantId?.personalData?.name || 'Unknown',
            applicantEmail: i.applicantId?.personalData?.email || '',
            jobId: i.jobId?._id.toString() || '',
            jobTitle: i.jobId?.title || 'Unknown',
            scheduledDate: i.scheduledDate,
            scheduledTime: i.scheduledTime,
            duration: i.duration,
            meetingLink: i.meetingLink,
            notes: i.notes,
            internalNotes: i.internalNotes,
            status: i.status,
            scheduledBy: {
                id: i.scheduledBy?._id.toString() || '',
                name: i.scheduledBy?.name || 'Unknown',
                email: i.scheduledBy?.email || '',
            },
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
        }))

        return c.json({
            success: true,
            interviews: transformedInterviews,
            count: transformedInterviews.length,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
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

export default app
