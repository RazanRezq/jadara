import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Response from './responseSchema'

const createResponseSchema = z.object({
    applicantId: z.string().min(1, 'Applicant ID is required'),
    questionId: z.string().min(1, 'Question ID is required'),
    type: z.enum(['text', 'voice', 'multiple-choice', 'file']),
    // Text
    textAnswer: z.string().optional(),
    // Voice
    audioUrl: z.string().optional(),
    rawTranscript: z.string().optional(),
    cleanTranscript: z.string().optional(),
    audioDuration: z.number().min(0).optional(),
    // Multiple-choice
    selectedOption: z.string().optional(),
    // File
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    // Timing
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    timeSpent: z.number().min(0).optional(),
    // Flags
    isAutoSubmitted: z.boolean().optional().default(false),
    hasRecordingIssue: z.boolean().optional().default(false),
})

const reviewResponseSchema = z.object({
    reviewerRating: z.number().min(1).max(5),
    reviewerNotes: z.string().optional(),
})

const app = new Hono()

// Submit response
app.post('/submit', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = createResponseSchema.safeParse(body)
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

        // Check if response already exists
        const existing = await Response.findOne({
            applicantId: validation.data.applicantId,
            questionId: validation.data.questionId,
        })

        if (existing) {
            return c.json(
                {
                    success: false,
                    error: 'Response already submitted for this question',
                },
                409
            )
        }

        const responseData = {
            ...validation.data,
            startedAt: validation.data.startedAt ? new Date(validation.data.startedAt) : undefined,
            completedAt: validation.data.completedAt ? new Date(validation.data.completedAt) : new Date(),
        }

        const response = await Response.create(responseData)

        return c.json(
            {
                success: true,
                message: 'Response submitted successfully',
                response: {
                    id: response._id.toString(),
                    type: response.type,
                },
            },
            201
        )
    } catch (error) {
        console.error('Submit response error:', error)
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

// Update transcription (after AI processing)
app.post('/update-transcript/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()

        const transcriptSchema = z.object({
            rawTranscript: z.string().optional(),
            cleanTranscript: z.string().optional(),
        })

        const validation = transcriptSchema.safeParse(body)
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

        const response = await Response.findById(id)
        if (!response) {
            return c.json(
                {
                    success: false,
                    error: 'Response not found',
                },
                404
            )
        }

        if (validation.data.rawTranscript) {
            response.rawTranscript = validation.data.rawTranscript
        }
        if (validation.data.cleanTranscript) {
            response.cleanTranscript = validation.data.cleanTranscript
        }

        await response.save()

        return c.json({
            success: true,
            message: 'Transcript updated successfully',
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

// Get responses by applicant
app.get('/by-applicant/:applicantId', async (c) => {
    try {
        await dbConnect()
        const applicantId = c.req.param('applicantId')

        const responses = await Response.find({ applicantId })
            .sort({ questionId: 1 })

        return c.json({
            success: true,
            responses: responses.map((r) => ({
                id: r._id.toString(),
                applicantId: r.applicantId.toString(),
                question: r.questionId,
                type: r.type,
                textAnswer: r.textAnswer,
                audioUrl: r.audioUrl,
                rawTranscript: r.rawTranscript,
                cleanTranscript: r.cleanTranscript,
                audioDuration: r.audioDuration,
                selectedOption: r.selectedOption,
                fileUrl: r.fileUrl,
                fileName: r.fileName,
                fileSize: r.fileSize,
                startedAt: r.startedAt,
                completedAt: r.completedAt,
                timeSpent: r.timeSpent,
                isAutoSubmitted: r.isAutoSubmitted,
                hasRecordingIssue: r.hasRecordingIssue,
                reviewerRating: r.reviewerRating,
                reviewerNotes: r.reviewerNotes,
                reviewedBy: r.reviewedBy,
                reviewedAt: r.reviewedAt,
                createdAt: r.createdAt,
            })),
            total: responses.length,
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

// Get single response
app.get('/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')

        const response = await Response.findById(id)
            .populate('reviewedBy', 'name')

        if (!response) {
            return c.json(
                {
                    success: false,
                    error: 'Response not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            response: {
                id: response._id.toString(),
                applicantId: response.applicantId.toString(),
                question: response.questionId,
                type: response.type,
                textAnswer: response.textAnswer,
                audioUrl: response.audioUrl,
                rawTranscript: response.rawTranscript,
                cleanTranscript: response.cleanTranscript,
                audioDuration: response.audioDuration,
                selectedOption: response.selectedOption,
                fileUrl: response.fileUrl,
                fileName: response.fileName,
                fileSize: response.fileSize,
                startedAt: response.startedAt,
                completedAt: response.completedAt,
                timeSpent: response.timeSpent,
                isAutoSubmitted: response.isAutoSubmitted,
                hasRecordingIssue: response.hasRecordingIssue,
                reviewerRating: response.reviewerRating,
                reviewerNotes: response.reviewerNotes,
                reviewedBy: response.reviewedBy,
                reviewedAt: response.reviewedAt,
                createdAt: response.createdAt,
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

// Add reviewer rating (for reviewers to rate answers)
app.post('/review/:id', async (c) => {
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

        const validation = reviewResponseSchema.safeParse(body)
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

        const response = await Response.findById(id)
        if (!response) {
            return c.json(
                {
                    success: false,
                    error: 'Response not found',
                },
                404
            )
        }

        response.reviewerRating = validation.data.reviewerRating
        response.reviewerNotes = validation.data.reviewerNotes || ''
        response.reviewedBy = userId as unknown as mongoose.Types.ObjectId
        response.reviewedAt = new Date()

        await response.save()

        return c.json({
            success: true,
            message: 'Review submitted successfully',
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

// Delete response
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

        const response = await Response.findById(id)
        if (!response) {
            return c.json(
                {
                    success: false,
                    error: 'Response not found',
                },
                404
            )
        }

        await Response.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'Response deleted successfully',
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

// Import mongoose for type casting
import mongoose from 'mongoose'

export default app

