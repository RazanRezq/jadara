import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Applicant, { LEGACY_STATUS_MAP, type ApplicantStatus } from './applicantSchema'
import { authenticate, getAuthUser, requireRole } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'
import Evaluation from '@/models/Evaluations/evaluationSchema'
import Review from '@/models/Reviews/reviewSchema'
import User from '@/models/Users/userSchema'
import Interview from '@/models/Interviews/interviewSchema'
import { revalidatePath } from 'next/cache'

// ═══════════════════════════════════════════════════════════════════════════════
// GOLDEN LIST STATUS NORMALIZATION
// Transforms any legacy DB status to one of the 5 canonical statuses
// ═══════════════════════════════════════════════════════════════════════════════
const GOLDEN_STATUSES: ApplicantStatus[] = ['new', 'evaluated', 'interview', 'hired', 'rejected']

function normalizeStatus(dbStatus: string): ApplicantStatus {
    // If already a Golden List status, return as-is
    if (GOLDEN_STATUSES.includes(dbStatus as ApplicantStatus)) {
        return dbStatus as ApplicantStatus
    }
    // Map legacy status to Golden List
    return LEGACY_STATUS_MAP[dbStatus] || 'new'
}

// Zod schema uses Golden List for input validation
const updateApplicantSchema = z.object({
    status: z.enum(['new', 'evaluated', 'interview', 'hired', 'rejected']).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    aiScore: z.number().min(0).max(100).optional(),
    aiSummary: z.string().optional(),
    aiRedFlags: z.array(z.string()).optional(),
    isSuspicious: z.boolean().optional(),
    suspiciousReason: z.string().optional(),
})

const statusOnlySchema = z.object({
    status: z.enum(['new', 'evaluated', 'interview', 'hired', 'rejected'])
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
        const includeRelations = c.req.query('includeRelations') === 'true'

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
        
        // Fetch applicants with safe populate
        let applicants
        try {
            applicants = await Applicant.find(query)
                .select('personalData cvUrl status tags notes aiScore aiSummary aiRedFlags isSuspicious isComplete submittedAt createdAt jobId')
                .populate('jobId', 'title currency')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
        } catch (populateError) {
            // If populate fails, try without populate
            console.error('Error populating jobId, fetching without populate:', populateError)
            applicants = await Applicant.find(query)
                .select('personalData cvUrl status tags notes aiScore aiSummary aiRedFlags isSuspicious isComplete submittedAt createdAt jobId')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
        }

        // Fetch related data (evaluations, review badges, and interviews) if requested
        let evaluationsMap = new Map()
        let reviewsMap = new Map()
        let interviewsMap = new Map()

        if (includeRelations && applicants.length > 0) {
            try {
                const applicantIds = applicants.map((a: any) => a._id)

                // Fetch evaluations, reviews, and interviews in parallel
                const [evaluations, reviews, interviews] = await Promise.all([
                    // Fetch evaluations
                    Evaluation.find({ applicantId: { $in: applicantIds } })
                        .select('applicantId summary strengths weaknesses recommendation overallScore categoryScores')
                        .lean()
                        .catch(() => []), // Return empty array on error

                    // Fetch reviews with reviewer info
                    Review.aggregate([
                        { $match: { applicantId: { $in: applicantIds } } },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'reviewerId',
                                foreignField: '_id',
                                as: 'reviewer'
                            }
                        },
                        { $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: false } },
                        { $match: { 'reviewer.role': 'reviewer' } }, // Only include reviews from reviewers
                        {
                            $project: {
                                applicantId: 1,
                                reviewerId: 1,
                                rating: 1,
                                reviewerName: '$reviewer.name',
                                reviewerInitials: {
                                    $concat: [
                                        { $substr: [{ $arrayElemAt: [{ $split: ['$reviewer.name', ' '] }, 0] }, 0, 1] },
                                        { $substr: [{ $arrayElemAt: [{ $split: ['$reviewer.name', ' '] }, -1] }, 0, 1] }
                                    ]
                                }
                            }
                        }
                    ]).catch(() => []), // Return empty array on error

                    // Fetch interviews
                    Interview.find({
                        applicantId: { $in: applicantIds },
                        status: { $in: ['scheduled', 'confirmed'] } // Only fetch upcoming/scheduled interviews
                    })
                        .select('applicantId scheduledDate scheduledTime duration meetingLink notes status')
                        .sort({ scheduledDate: 1 }) // Get earliest upcoming interview
                        .lean()
                        .catch(() => []) // Return empty array on error
                ])

                // Build evaluations map
                if (Array.isArray(evaluations)) {
                    evaluations.forEach((evaluation: any) => {
                        if (evaluation && evaluation.applicantId) {
                            const applicantId = String(evaluation.applicantId)
                            evaluationsMap.set(applicantId, {
                                summary: evaluation.summary,
                                strengths: evaluation.strengths,
                                weaknesses: evaluation.weaknesses,
                                recommendation: evaluation.recommendation,
                                overallScore: evaluation.overallScore,
                                categoryScores: evaluation.categoryScores,
                            })
                        }
                    })
                }

                // Build reviews map (grouped by applicant)
                if (Array.isArray(reviews)) {
                    const reviewsByApplicant = new Map()
                    reviews.forEach((review: any) => {
                        if (review && review.applicantId && review.reviewerName) {
                            const applicantId = String(review.applicantId)
                            if (!reviewsByApplicant.has(applicantId)) {
                                reviewsByApplicant.set(applicantId, [])
                            }
                            reviewsByApplicant.get(applicantId).push({
                                reviewerId: String(review.reviewerId),
                                rating: review.rating,
                                initials: review.reviewerInitials || (review.reviewerName ? review.reviewerName.substring(0, 2).toUpperCase() : 'NA'),
                                name: review.reviewerName,
                            })
                        }
                    })
                    reviewsMap = reviewsByApplicant
                }

                // Build interviews map (only the most recent upcoming interview per applicant)
                if (Array.isArray(interviews)) {
                    interviews.forEach((interview: any) => {
                        if (interview && interview.applicantId) {
                            const applicantId = String(interview.applicantId)
                            // Only store the first (earliest) interview for each applicant
                            if (!interviewsMap.has(applicantId)) {
                                interviewsMap.set(applicantId, {
                                    id: String(interview._id),
                                    scheduledDate: interview.scheduledDate,
                                    scheduledTime: interview.scheduledTime,
                                    duration: interview.duration,
                                    meetingLink: interview.meetingLink,
                                    notes: interview.notes,
                                    status: interview.status,
                                })
                            }
                        }
                    })
                }
            } catch (relationsError) {
                // Log error but don't fail the entire request
                console.error('Error fetching related data:', relationsError)
                // Continue with empty maps - the applicants will still be returned
            }
        }

        // Remove sensitive data for reviewers
        const isReviewer = user.role === 'reviewer'

        // Helper function to generate display name
        const getDisplayName = (personalData: any): string => {
            if (!personalData) return 'Unnamed Candidate'
            if (personalData.name && personalData.name.trim()) return personalData.name.trim()
            // Fallback: try email prefix
            if (personalData.email) {
                const emailPrefix = personalData.email.split('@')[0]
                if (emailPrefix) return emailPrefix
            }
            return 'Unnamed Candidate'
        }

        return c.json({
            success: true,
            applicants: applicants.map((a) => {
                const applicantId = String(a._id)
                return {
                    id: applicantId,
                    jobId: a.jobId,
                    // NORMALIZED: Always provide a displayName for UI consistency
                    displayName: getDisplayName(a.personalData),
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
                    // GOLDEN LIST: Normalize legacy statuses before sending to client
                    status: normalizeStatus(a.status),
                    tags: a.tags,
                    notes: a.notes,
                    aiScore: a.aiScore,
                    aiSummary: a.aiSummary,
                    aiRedFlags: isReviewer ? undefined : a.aiRedFlags, // Hide from reviewers
                    isSuspicious: a.isSuspicious,
                    isComplete: a.isComplete,
                    submittedAt: a.submittedAt,
                    createdAt: a.createdAt,
                    // Include related data if requested
                    ...(includeRelations && {
                        evaluation: evaluationsMap.get(applicantId) || null,
                        reviewBadges: reviewsMap.get(applicantId) || [],
                        interview: interviewsMap.get(applicantId) || null
                    })
                }
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error in /api/applicants/list:', error)
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

        // Helper function to generate display name
        const getDisplayName = (personalData: any): string => {
            if (!personalData) return 'Unnamed Candidate'
            if (personalData.name && personalData.name.trim()) return personalData.name.trim()
            if (personalData.email) {
                const emailPrefix = personalData.email.split('@')[0]
                if (emailPrefix) return emailPrefix
            }
            return 'Unnamed Candidate'
        }

        return c.json({
            success: true,
            applicant: {
                id: applicant._id.toString(),
                jobId: applicant.jobId,
                // NORMALIZED: Always provide a displayName for UI consistency
                displayName: getDisplayName(applicant.personalData),
                personalData: {
                    ...applicant.personalData,
                    salaryExpectation: isReviewer ? undefined : applicant.personalData.salaryExpectation,
                },
                cvUrl: applicant.cvUrl,
                cvParsedData: applicant.cvParsedData,
                // GOLDEN LIST: Normalize legacy statuses before sending to client
                status: normalizeStatus(applicant.status),
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
        const user = getAuthUser(c)

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

        const applicant = await Applicant.findById(id).populate('jobId', 'title')
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        const oldStatus = applicant.status
        const applicantName = applicant.personalData?.name || 'Unknown'
        const applicantEmail = applicant.personalData?.email || 'Unknown'
        const jobTitle = applicant.jobId && typeof applicant.jobId === 'object' ? (applicant.jobId as any).title : 'Unknown'

        Object.assign(applicant, validation.data)
        await applicant.save()

        // Log status change if status was updated
        if (validation.data.status && oldStatus !== validation.data.status) {
            await logUserAction(
                user,
                'applicant.status_changed',
                'Applicant',
                applicant._id.toString(),
                `Changed applicant status: ${applicantName} from ${oldStatus} to ${validation.data.status}`,
                {
                    resourceName: applicantName,
                    changes: {
                        before: { status: oldStatus },
                        after: { status: validation.data.status },
                    },
                    metadata: {
                        applicantEmail,
                        jobTitle,
                        oldStatus,
                        newStatus: validation.data.status,
                    },
                    severity: 'info',
                }
            )

            // Auto-send emails on status change (CRITICAL for workflow)
            try {
                const { sendOfferEmail, sendRejectionEmail } = await import('@/lib/email')

                if (validation.data.status === 'hired' && applicantEmail && applicantEmail !== 'Unknown') {
                    await sendOfferEmail(applicantEmail, {
                        candidateName: applicantName,
                        jobTitle: jobTitle,
                    })
                    console.log(`✅ Offer email sent to ${applicantEmail}`)
                }

                if (validation.data.status === 'rejected' && applicantEmail && applicantEmail !== 'Unknown') {
                    await sendRejectionEmail(applicantEmail, {
                        candidateName: applicantName,
                        jobTitle: jobTitle,
                    })
                    console.log(`✅ Rejection email sent to ${applicantEmail}`)
                }
            } catch (emailError) {
                console.error('❌ Failed to send email:', emailError)
                // Don't fail the status update if email fails
            }

            // Revalidate dashboard to update "My Reviews" lists
            revalidatePath('/dashboard')
        }

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

// PATCH /:id/status - Update applicant status only
app.patch('/:id/status', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const user = getAuthUser(c)

        // Validate status only
        const validation = statusOnlySchema.safeParse(body)
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

        const applicant = await Applicant.findById(id).populate('jobId', 'title')
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        const oldStatus = applicant.status
        const newStatus = validation.data.status

        // Only update if status actually changed
        if (oldStatus === newStatus) {
            return c.json({
                success: true,
                message: 'Status unchanged',
                applicant: {
                    id: applicant._id.toString(),
                    status: applicant.status,
                },
            })
        }

        // Update status
        applicant.status = newStatus
        await applicant.save()

        // Log status change
        const applicantName = applicant.personalData?.name || 'Unknown'
        const applicantEmail = applicant.personalData?.email || 'Unknown'
        const jobTitle = applicant.jobId && typeof applicant.jobId === 'object'
            ? (applicant.jobId as any).title
            : 'Unknown'

        await logUserAction(
            user,
            'applicant.status_changed',
            'Applicant',
            applicant._id.toString(),
            `Changed applicant status: ${applicantName} from ${oldStatus} to ${newStatus}`,
            {
                resourceName: applicantName,
                changes: {
                    before: { status: oldStatus },
                    after: { status: newStatus },
                },
                metadata: {
                    applicantEmail,
                    jobTitle,
                    oldStatus,
                    newStatus,
                },
                severity: 'info',
            }
        )

        // Send emails if needed
        if (applicantEmail && applicantEmail !== 'Unknown') {
            try {
                const { sendOfferEmail, sendRejectionEmail } = await import('@/lib/email')

                if (newStatus === 'hired') {
                    await sendOfferEmail(applicantEmail, {
                        candidateName: applicantName,
                        jobTitle: jobTitle,
                    })
                    console.log(`✅ Offer email sent to ${applicantEmail}`)
                }

                if (newStatus === 'rejected') {
                    await sendRejectionEmail(applicantEmail, {
                        candidateName: applicantName,
                        jobTitle: jobTitle,
                    })
                    console.log(`✅ Rejection email sent to ${applicantEmail}`)
                }
            } catch (emailError) {
                console.error('❌ Failed to send email:', emailError)
                // Don't fail the status update if email fails
            }
        }

        // Revalidate dashboard to update "My Reviews" lists
        revalidatePath('/dashboard')

        return c.json({
            success: true,
            message: 'Applicant status updated successfully',
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
        const user = getAuthUser(c)

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

        // Log bulk status change
        await logUserAction(
            user,
            'applicant.bulk_status_changed',
            'Applicant',
            validation.data.ids.join(','),
            `Bulk updated ${validation.data.ids.length} applicants to status: ${validation.data.status}`,
            {
                metadata: {
                    count: validation.data.ids.length,
                    newStatus: validation.data.status,
                    applicantIds: validation.data.ids,
                },
                severity: 'info',
            }
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
app.delete('/delete/:id', authenticate, requireRole('admin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const user = getAuthUser(c)

        const applicant = await Applicant.findById(id).populate('jobId', 'title')
        if (!applicant) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant not found',
                },
                404
            )
        }

        const applicantName = applicant.personalData?.name || 'Unknown'
        const applicantEmail = applicant.personalData?.email || 'Unknown'
        const jobTitle = applicant.jobId && typeof applicant.jobId === 'object' ? (applicant.jobId as any).title : 'Unknown'

        await Applicant.findByIdAndDelete(id)

        // Log applicant deletion
        await logUserAction(
            user,
            'applicant.deleted',
            'Applicant',
            id,
            `Deleted applicant: ${applicantName} (${applicantEmail})`,
            {
                resourceName: applicantName,
                metadata: {
                    applicantEmail,
                    jobTitle,
                },
                severity: 'warning',
            }
        )

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

// ===========================
// Bulk Delete Applicants
// ===========================
app.post('/bulk-delete', async (c) => {
    try {
        await dbConnect()

        const { applicantIds } = await c.req.json()

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant IDs are required',
                },
                400
            )
        }

        const result = await Applicant.deleteMany({
            _id: { $in: applicantIds },
        })

        return c.json({
            success: true,
            count: result.deletedCount,
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

// ===========================
// Bulk Archive Applicants
// ===========================
app.post('/bulk-archive', async (c) => {
    try {
        await dbConnect()

        const { applicantIds } = await c.req.json()

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant IDs are required',
                },
                400
            )
        }

        const result = await Applicant.updateMany(
            { _id: { $in: applicantIds } },
            { $set: { status: 'archived' } }
        )

        return c.json({
            success: true,
            count: result.modifiedCount,
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

// ===========================
// Bulk Status Change
// ===========================
app.post('/bulk-status', async (c) => {
    try {
        await dbConnect()

        const { applicantIds, status } = await c.req.json()

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return c.json(
                {
                    success: false,
                    error: 'Applicant IDs are required',
                },
                400
            )
        }

        if (!status) {
            return c.json(
                {
                    success: false,
                    error: 'Status is required',
                },
                400
            )
        }

        const result = await Applicant.updateMany(
            { _id: { $in: applicantIds } },
            { $set: { status } }
        )

        return c.json({
            success: true,
            count: result.modifiedCount,
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

