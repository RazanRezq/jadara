import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Evaluation from './evaluationSchema'
import Applicant from '../Applicants/applicantSchema'
import mongoose from 'mongoose'
import { authenticate, getAuthUser } from '@/lib/authMiddleware'

// Bilingual content schemas
const bilingualTextSchema = z.object({
    en: z.string().default(''),
    ar: z.string().default(''),
})

const bilingualTextArraySchema = z.object({
    en: z.array(z.string()).default([]),
    ar: z.array(z.string()).default([]),
})

const criteriaMatchSchema = z.object({
    criteriaName: z.string(),
    matched: z.boolean(),
    score: z.number().min(0).max(100),
    weight: z.number().min(1).max(10).optional().default(5),
    reason: bilingualTextSchema,
    evidence: bilingualTextArraySchema.optional().default({ en: [], ar: [] }),
})

const createEvaluationSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    jobId: z.string().min(1, 'Job ID is required'),
    overallScore: z.number().min(0).max(100).default(0),
    criteriaMatches: z.array(criteriaMatchSchema).optional().default([]),
    strengths: bilingualTextArraySchema.optional().default({ en: [], ar: [] }),
    weaknesses: bilingualTextArraySchema.optional().default({ en: [], ar: [] }),
    redFlags: bilingualTextArraySchema.optional().default({ en: [], ar: [] }),
    summary: bilingualTextSchema.optional().default({ en: '', ar: '' }),
    recommendation: z.enum(['hire', 'hold', 'reject', 'pending']).default('pending'),
    recommendationReason: bilingualTextSchema.optional().default({ en: '', ar: '' }),
    suggestedQuestions: bilingualTextArraySchema.optional().default({ en: [], ar: [] }),
    sentimentScore: z.number().min(-1).max(1).optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
})

const updateEvaluationSchema = z.object({
    overallScore: z.number().min(0).max(100).optional(),
    criteriaMatches: z.array(criteriaMatchSchema).optional(),
    strengths: bilingualTextArraySchema.optional(),
    weaknesses: bilingualTextArraySchema.optional(),
    redFlags: bilingualTextArraySchema.optional(),
    summary: bilingualTextSchema.optional(),
    recommendation: z.enum(['hire', 'hold', 'reject', 'pending']).optional(),
    recommendationReason: bilingualTextSchema.optional(),
    suggestedQuestions: bilingualTextArraySchema.optional(),
    sentimentScore: z.number().min(-1).max(1).optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
    manualRecommendation: z.enum(['hire', 'hold', 'reject', 'pending']).optional(),
    manualNotes: z.string().optional(),
    isProcessed: z.boolean().optional(),
    processingError: z.string().optional(),
})

const app = new Hono()

// Create evaluation (called after AI processing)
app.post('/create', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = createEvaluationSchema.safeParse(body)
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

        // Check if evaluation already exists
        const existing = await Evaluation.findOne({
            applicantId: validation.data.applicantId,
        })

        if (existing) {
            // Update existing evaluation
            Object.assign(existing, validation.data)
            existing.isProcessed = true
            existing.processedAt = new Date()
            await existing.save()

            // Update applicant with AI score
            // SILENT SCORER: AI does NOT update status - only reviewers can move candidates
            await Applicant.findByIdAndUpdate(validation.data.applicantId, {
                aiScore: validation.data.overallScore,
                aiSummary: validation.data.summary,
                aiRedFlags: validation.data.redFlags,
                // status: 'evaluated', // REMOVED: AI does not update status per Reviewer-Driven Pipeline
            })

            return c.json({
                success: true,
                message: 'Evaluation updated',
                evaluation: {
                    id: existing._id.toString(),
                },
            })
        }

        const evaluation = await Evaluation.create({
            ...validation.data,
            isProcessed: true,
            processedAt: new Date(),
        })

        // Update applicant with AI score
        // SILENT SCORER: AI does NOT update status - only reviewers can move candidates
        await Applicant.findByIdAndUpdate(validation.data.applicantId, {
            aiScore: validation.data.overallScore,
            aiSummary: validation.data.summary,
            aiRedFlags: validation.data.redFlags,
            // status: 'evaluated', // REMOVED: AI does not update status per Reviewer-Driven Pipeline
        })

        return c.json(
            {
                success: true,
                message: 'Evaluation created successfully',
                evaluation: {
                    id: evaluation._id.toString(),
                },
            },
            201
        )
    } catch (error) {
        console.error('Create evaluation error:', error)
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

// Get evaluation by applicant
app.get('/by-applicant/:applicantId', authenticate, async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const user = getAuthUser(c)

        const evaluation = await Evaluation.findOne({ applicantId })
            .populate('reviewedBy', 'name')
            .lean()

        if (!evaluation) {
            // Return success: true but with null evaluation to avoid treating as error
            return c.json({
                success: true,
                evaluation: null,
                message: 'No evaluation found for this applicant',
            })
        }

        const isReviewer = user.role === 'reviewer'

        return c.json({
            success: true,
            evaluation: {
                id: String(evaluation._id),
                applicantId: String(evaluation.applicantId),
                jobId: String(evaluation.jobId),
                overallScore: evaluation.overallScore,
                criteriaMatches: evaluation.criteriaMatches,
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                redFlags: isReviewer ? [] : evaluation.redFlags, // Hide from reviewers
                summary: evaluation.summary,
                recommendation: evaluation.recommendation,
                recommendationReason: evaluation.recommendationReason,
                suggestedQuestions: evaluation.suggestedQuestions,
                sentimentScore: evaluation.sentimentScore,
                confidenceScore: evaluation.confidenceScore,
                isProcessed: evaluation.isProcessed,
                processedAt: evaluation.processedAt,
                manualRecommendation: evaluation.manualRecommendation,
                manualNotes: evaluation.manualNotes,
                reviewedBy: evaluation.reviewedBy,
                reviewedAt: evaluation.reviewedAt,
                createdAt: evaluation.createdAt,
                // New detailed analysis fields
                voiceAnalysisDetails: evaluation.voiceAnalysisDetails,
                socialProfileInsights: evaluation.socialProfileInsights,
                textResponseAnalysis: evaluation.textResponseAnalysis,
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

// Batch get evaluations for multiple applicants (reduces API calls)
app.post('/batch-by-applicants', authenticate, async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()
        const applicantIds = body.applicantIds as string[]
        const user = getAuthUser(c)

        if (!Array.isArray(applicantIds) || applicantIds.length === 0) {
            return c.json(
                {
                    success: false,
                    error: 'applicantIds array is required',
                },
                400
            )
        }

        // Limit to 100 applicants per request
        if (applicantIds.length > 100) {
            return c.json(
                {
                    success: false,
                    error: 'Maximum 100 applicant IDs per request',
                },
                400
            )
        }

        const evaluations = await Evaluation.find({
            applicantId: { $in: applicantIds },
        })
            .populate('reviewedBy', 'name')
            .lean()

        const isReviewer = user.role === 'reviewer'

        // Create a map for quick lookup
        const evaluationMap: Record<string, unknown> = {}
        evaluations.forEach((e) => {
            evaluationMap[String(e.applicantId)] = {
                id: String(e._id),
                applicantId: String(e.applicantId),
                jobId: String(e.jobId),
                overallScore: e.overallScore,
                criteriaMatches: e.criteriaMatches,
                strengths: e.strengths,
                weaknesses: e.weaknesses,
                redFlags: isReviewer ? [] : e.redFlags,
                summary: e.summary,
                recommendation: e.recommendation,
                recommendationReason: e.recommendationReason,
                suggestedQuestions: e.suggestedQuestions,
                sentimentScore: e.sentimentScore,
                confidenceScore: e.confidenceScore,
                isProcessed: e.isProcessed,
                processedAt: e.processedAt,
                manualRecommendation: e.manualRecommendation,
                manualNotes: e.manualNotes,
                reviewedBy: e.reviewedBy,
                reviewedAt: e.reviewedAt,
                createdAt: e.createdAt,
                // Detailed analysis fields
                voiceAnalysisDetails: e.voiceAnalysisDetails,
                socialProfileInsights: e.socialProfileInsights,
                textResponseAnalysis: e.textResponseAnalysis,
            }
        })

        return c.json({
            success: true,
            evaluations: evaluationMap,
            found: evaluations.length,
            requested: applicantIds.length,
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

// Get evaluations by job with sorting
app.get('/by-job/:jobId', authenticate, async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')
        const sortBy = c.req.query('sortBy') || 'score' // score, date
        const order = c.req.query('order') === 'asc' ? 1 : -1
        const recommendation = c.req.query('recommendation')
        const minScore = c.req.query('minScore')
        const user = getAuthUser(c)

        const query: Record<string, unknown> = { jobId, isProcessed: true }

        if (recommendation && recommendation !== 'all') {
            query.recommendation = recommendation
        }

        if (minScore) {
            query.overallScore = { $gte: parseInt(minScore) }
        }

        const sortField = sortBy === 'date' ? 'createdAt' : 'overallScore'

        const evaluations = await Evaluation.find(query)
            .select('applicantId overallScore recommendation summary redFlags criteriaMatches isProcessed createdAt')
            .populate('applicantId', 'personalData.name personalData.email')
            .sort({ [sortField]: order })
            .limit(100)
            .lean()

        const isReviewer = user.role === 'reviewer'

        return c.json({
            success: true,
            evaluations: evaluations.map((e) => ({
                id: String(e._id),
                applicantId: e.applicantId,
                overallScore: e.overallScore,
                recommendation: e.recommendation,
                summary: e.summary,
                redFlags: isReviewer ? [] : e.redFlags,
                criteriaMatches: e.criteriaMatches,
                isProcessed: e.isProcessed,
                createdAt: e.createdAt,
            })),
            total: evaluations.length,
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

// Update evaluation (add manual notes, override recommendation)
app.post('/update/:id', authenticate, async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const user = getAuthUser(c)

        const validation = updateEvaluationSchema.safeParse(body)
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

        const evaluation = await Evaluation.findById(id)
        if (!evaluation) {
            return c.json(
                {
                    success: false,
                    error: 'Evaluation not found',
                },
                404
            )
        }

        // If adding manual review
        if (validation.data.manualRecommendation || validation.data.manualNotes) {
            evaluation.reviewedBy = user.userId as unknown as mongoose.Types.ObjectId
            evaluation.reviewedAt = new Date()
        }

        Object.assign(evaluation, validation.data)
        await evaluation.save()

        return c.json({
            success: true,
            message: 'Evaluation updated successfully',
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

// Get top candidates for a job
app.get('/top-candidates/:jobId', authenticate, async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')
        const limit = parseInt(c.req.query('limit') || '10')
        const minScore = parseInt(c.req.query('minScore') || '0')

        const evaluations = await Evaluation.find({
            jobId,
            isProcessed: true,
            overallScore: { $gte: minScore },
            recommendation: { $in: ['hire', 'hold'] },
        })
            .populate('applicantId', 'personalData status')
            .sort({ overallScore: -1 })
            .limit(limit)

        return c.json({
            success: true,
            candidates: evaluations.map((e) => ({
                evaluationId: e._id.toString(),
                applicant: e.applicantId,
                score: e.overallScore,
                recommendation: e.recommendation,
                summary: e.summary,
                strengths: e.strengths,
            })),
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

// Get statistics for a job
app.get('/stats/:jobId', async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')

        const [
            total,
            hireCount,
            holdCount,
            rejectCount,
            pendingCount,
            avgScore,
            scoreDistribution,
        ] = await Promise.all([
            Evaluation.countDocuments({ jobId, isProcessed: true }),
            Evaluation.countDocuments({ jobId, isProcessed: true, recommendation: 'hire' }),
            Evaluation.countDocuments({ jobId, isProcessed: true, recommendation: 'hold' }),
            Evaluation.countDocuments({ jobId, isProcessed: true, recommendation: 'reject' }),
            Evaluation.countDocuments({ jobId, isProcessed: true, recommendation: 'pending' }),
            Evaluation.aggregate([
                { $match: { jobId: new mongoose.Types.ObjectId(jobId), isProcessed: true } },
                { $group: { _id: null, avg: { $avg: '$overallScore' } } },
            ]),
            Evaluation.aggregate([
                { $match: { jobId: new mongoose.Types.ObjectId(jobId), isProcessed: true } },
                {
                    $bucket: {
                        groupBy: '$overallScore',
                        boundaries: [0, 20, 40, 60, 80, 100],
                        default: 100,
                        output: { count: { $sum: 1 } },
                    },
                },
            ]),
        ])

        return c.json({
            success: true,
            stats: {
                total,
                byRecommendation: {
                    hire: hireCount,
                    hold: holdCount,
                    reject: rejectCount,
                    pending: pendingCount,
                },
                averageScore: avgScore[0]?.avg || 0,
                scoreDistribution: scoreDistribution.map((s) => ({
                    range: `${s._id}-${s._id + 19}`,
                    count: s.count,
                })),
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

// Delete evaluation
app.delete('/delete/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
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

        const evaluation = await Evaluation.findById(id)
        if (!evaluation) {
            return c.json(
                {
                    success: false,
                    error: 'Evaluation not found',
                },
                404
            )
        }

        await Evaluation.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'Evaluation deleted successfully',
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

