import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Applicant from './applicantSchema'
import { authenticate, getAuthUser } from '@/lib/authMiddleware'

const updateApplicantSchema = z.object({
    status: z.enum(['new', 'screening', 'interviewing', 'evaluated', 'shortlisted', 'hired', 'rejected', 'withdrawn']).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    aiScore: z.number().min(0).max(100).optional(),
    aiSummary: z.string().optional(),
    aiRedFlags: z.array(z.string()).optional(),
    isSuspicious: z.boolean().optional(),
    suspiciousReason: z.string().optional(),
})

const app = new Hono()

// ============================================
// REMOVED: /start, /submit, /flag-suspicious
// ============================================
// These endpoints violated the "Atomic Submission" principle.
// Application creation now happens ONLY via the submitApplication() server action
// in src/app/(public)/apply/[jobId]/_components/actions.ts
// ============================================

// Get all applicants with pagination and filtering (Admin)
app.get('/list', authenticate, async (c) => {
    try {
        await dbConnect()
        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '10')
        const searchTerm = c.req.query('search') || ''
        const jobId = c.req.query('jobId') || ''
        const status = c.req.query('status') || ''
        const minScore = c.req.query('minScore')
        const maxAge = c.req.query('maxAge')
        const minExperience = c.req.query('minExperience')
        const user = getAuthUser(c)
        const onlyComplete = c.req.query('onlyComplete') === 'true'

        const query: Record<string, unknown> = {}
        
        // Only filter by isComplete if explicitly requested
        // By default, show all applicants regardless of completion status
        if (onlyComplete) {
            query.isComplete = true
        }

        if (searchTerm) {
            query.$or = [
                { 'personalData.name': { $regex: searchTerm, $options: 'i' } },
                { 'personalData.email': { $regex: searchTerm, $options: 'i' } },
            ]
        }

        if (jobId) {
            query.jobId = jobId
        }

        if (status && status !== 'all') {
            query.status = status
        }

        // Advanced filters for AND logic
        if (minScore) {
            query.aiScore = { $gte: parseInt(minScore) }
        }

        if (maxAge) {
            query['personalData.age'] = { $lte: parseInt(maxAge) }
        }

        if (minExperience) {
            query['personalData.yearsOfExperience'] = { $gte: parseInt(minExperience) }
        }

        const skip = (page - 1) * limit
        const total = await Applicant.countDocuments(query)
        const applicants = await Applicant.find(query)
            .select('personalData cvUrl status tags notes aiScore aiSummary aiRedFlags isSuspicious isComplete submittedAt createdAt jobId')
            .populate('jobId', 'title')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean()

        // Remove sensitive data for reviewers
        const isReviewer = user.role === 'reviewer'

        return c.json({
            success: true,
            applicants: applicants.map((a) => ({
                id: String(a._id),
                jobId: a.jobId,
                personalData: a.personalData ? {
                    name: a.personalData.name || '',
                    email: a.personalData.email || '',
                    phone: a.personalData.phone || '',
                    age: a.personalData.age,
                    major: a.personalData.major,
                    yearsOfExperience: a.personalData.yearsOfExperience,
                    // Hide salary expectation from reviewers
                    salaryExpectation: isReviewer ? undefined : a.personalData.salaryExpectation,
                    linkedinUrl: a.personalData.linkedinUrl,
                    behanceUrl: a.personalData.behanceUrl,
                    portfolioUrl: a.personalData.portfolioUrl,
                    // Include screening answers and language proficiency (safely convert Maps)
                    screeningAnswers: a.personalData.screeningAnswers && a.personalData.screeningAnswers instanceof Map
                        ? Object.fromEntries(a.personalData.screeningAnswers)
                        : a.personalData.screeningAnswers || undefined,
                    languageProficiency: a.personalData.languageProficiency && a.personalData.languageProficiency instanceof Map
                        ? Object.fromEntries(a.personalData.languageProficiency)
                        : a.personalData.languageProficiency || undefined,
                } : {
                    name: '',
                    email: '',
                    phone: '',
                },
                cvUrl: a.cvUrl,
                status: a.status,
                tags: a.tags,
                notes: a.notes,
                aiScore: a.aiScore,
                aiSummary: a.aiSummary,
                aiRedFlags: isReviewer ? undefined : a.aiRedFlags, // Hide from reviewers
                isSuspicious: a.isSuspicious,
                isComplete: a.isComplete,
                submittedAt: a.submittedAt,
                createdAt: a.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Get single applicant
app.get('/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const user = getAuthUser(c)

        const applicant = await Applicant.findById(id).populate('jobId', 'title criteria')

        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        const isReviewer = user.role === 'reviewer'

        return c.json({
            success: true,
            applicant: {
                id: applicant._id.toString(),
                jobId: applicant.jobId,
                personalData: {
                    ...applicant.personalData,
                    salaryExpectation: isReviewer ? undefined : applicant.personalData.salaryExpectation,
                },
                cvUrl: applicant.cvUrl,
                cvParsedData: applicant.cvParsedData,
                status: applicant.status,
                tags: applicant.tags,
                notes: applicant.notes,
                aiScore: applicant.aiScore,
                aiSummary: applicant.aiSummary,
                aiRedFlags: isReviewer ? undefined : applicant.aiRedFlags,
                isSuspicious: applicant.isSuspicious,
                suspiciousReason: applicant.suspiciousReason,
                isComplete: applicant.isComplete,
                submittedAt: applicant.submittedAt,
                createdAt: applicant.createdAt,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Update applicant (change status, add notes, etc.)
app.post('/update/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const userId = c.req.query('userId')

        if (!userId) {
            return c.json(
                {
                    success: false,
                    error: 'User ID is required',
                },
                400
            )
        }

        const validation = updateApplicantSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const applicant = await Applicant.findById(id)
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        Object.assign(applicant, validation.data)
        await applicant.save()

        return c.json({
            success: true,
            message: 'Applicant updated successfully',
            applicant: {
                id: applicant._id.toString(),
                status: applicant.status,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Bulk update status
app.post('/bulk-update', authenticate, async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const bulkSchema = z.object({
            ids: z.array(z.string()).min(1),
            status: z.enum(['new', 'screening', 'interviewing', 'evaluated', 'shortlisted', 'hired', 'rejected', 'withdrawn']),
        })

        const validation = bulkSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        await Applicant.updateMany(
            { _id: { $in: validation.data.ids } },
            { $set: { status: validation.data.status } }
        )

        return c.json({
            success: true,
            message: `${validation.data.ids.length} applicants updated`,
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Delete applicant
app.delete('/delete/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const user = getAuthUser(c)

        if (user.role === 'reviewer') {
            return c.json(
                {
                    success: false,
                    error: 'Reviewers cannot delete applicants',
                },
                400
            )
        }

        const applicant = await Applicant.findById(id)
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        await Applicant.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'Applicant deleted successfully',
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Get statistics by job
app.get('/stats/:jobId', authenticate, async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')

        const [
            total,
            newCount,
            screeningCount,
            interviewingCount,
            shortlistedCount,
            hiredCount,
            rejectedCount,
            avgScore,
        ] = await Promise.all([
            Applicant.countDocuments({ jobId, isComplete: true }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'new' }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'screening' }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'interviewing' }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'shortlisted' }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'hired' }),
            Applicant.countDocuments({ jobId, isComplete: true, status: 'rejected' }),
            Applicant.aggregate([
                { $match: { jobId, isComplete: true, aiScore: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$aiScore' } } },
            ]),
        ])

        return c.json({
            success: true,
            stats: {
                total,
                byStatus: {
                    new: newCount,
                    screening: screeningCount,
                    interviewing: interviewingCount,
                    shortlisted: shortlistedCount,
                    hired: hiredCount,
                    rejected: rejectedCount,
                },
                averageScore: avgScore[0]?.avg || 0,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

export default app

