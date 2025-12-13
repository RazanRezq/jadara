import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Evaluation from './evaluationSchema'
import Applicant from '../Applicants/applicantSchema'
import mongoose from 'mongoose'

const criteriaMatchSchema = z.object({
    criteriaName: z.string(),
    matched: z.boolean(),
    score: z.number().min(0).max(100),
    reason: z.string(),
})

const createEvaluationSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    jobId: z.string().min(1, 'Job ID is required'),
    overallScore: z.number().min(0).max(100).default(0),
    criteriaMatches: z.array(criteriaMatchSchema).optional().default([]),
    strengths: z.array(z.string()).optional().default([]),
    weaknesses: z.array(z.string()).optional().default([]),
    redFlags: z.array(z.string()).optional().default([]),
    summary: z.string().optional().default(''),
    recommendation: z.enum(['hire', 'hold', 'reject', 'pending']).default('pending'),
    recommendationReason: z.string().optional().default(''),
    suggestedQuestions: z.array(z.string()).optional().default([]),
    sentimentScore: z.number().min(-1).max(1).optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
})

const updateEvaluationSchema = z.object({
    overallScore: z.number().min(0).max(100).optional(),
    criteriaMatches: z.array(criteriaMatchSchema).optional(),
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    redFlags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    recommendation: z.enum(['hire', 'hold', 'reject', 'pending']).optional(),
    recommendationReason: z.string().optional(),
    suggestedQuestions: z.array(z.string()).optional(),
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
            await Applicant.findByIdAndUpdate(validation.data.applicantId, {
                aiScore: validation.data.overallScore,
                aiSummary: validation.data.summary,
                aiRedFlags: validation.data.redFlags,
                status: 'evaluated',
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
        await Applicant.findByIdAndUpdate(validation.data.applicantId, {
            aiScore: validation.data.overallScore,
            aiSummary: validation.data.summary,
            aiRedFlags: validation.data.redFlags,
            status: 'evaluated',
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
app.get('/by-applicant/:applicantId', async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')
        const userRole = c.req.query('role') || 'admin'

        const evaluation = await Evaluation.findOne({ applicantId })
            .populate('reviewedBy', 'name')

        if (!evaluation) {
            return c.json(
                {
                    success: false,
                    error: 'Evaluation not found',
                },
                404
            )
        }

        const isReviewer = userRole === 'reviewer'

        return c.json({
            success: true,
            evaluation: {
                id: evaluation._id.toString(),
                applicantId: evaluation.applicantId.toString(),
                jobId: evaluation.jobId.toString(),
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

// Get evaluations by job with sorting
app.get('/by-job/:jobId', async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')
        const sortBy = c.req.query('sortBy') || 'score' // score, date
        const order = c.req.query('order') === 'asc' ? 1 : -1
        const recommendation = c.req.query('recommendation')
        const minScore = c.req.query('minScore')
        const userRole = c.req.query('role') || 'admin'

        const query: Record<string, unknown> = { jobId, isProcessed: true }

        if (recommendation && recommendation !== 'all') {
            query.recommendation = recommendation
        }

        if (minScore) {
            query.overallScore = { $gte: parseInt(minScore) }
        }

        const sortField = sortBy === 'date' ? 'createdAt' : 'overallScore'

        const evaluations = await Evaluation.find(query)
            .populate('applicantId', 'personalData.name personalData.email')
            .sort({ [sortField]: order })

        const isReviewer = userRole === 'reviewer'

        return c.json({
            success: true,
            evaluations: evaluations.map((e) => ({
                id: e._id.toString(),
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
app.post('/update/:id', async (c) => {
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
            evaluation.reviewedBy = userId as unknown as mongoose.Types.ObjectId
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
app.get('/top-candidates/:jobId', async (c) => {
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

