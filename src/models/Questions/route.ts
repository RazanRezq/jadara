import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Question from './questionSchema'

const optionSchema = z.object({
    label: z.string().min(1, 'Option label is required'),
    value: z.string().min(1, 'Option value is required'),
})

const createQuestionSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
    type: z.enum(['text', 'voice', 'multiple-choice', 'file-upload']),
    text: z.string().min(5, 'Question text must be at least 5 characters'),
    description: z.string().optional(),
    isRequired: z.boolean().default(true),
    order: z.number().min(0).default(0),
    // Voice settings
    timeLimit: z.number().min(30).max(600).optional().default(180),
    allowRetake: z.boolean().optional().default(false),
    showQuestionBeforeRecording: z.boolean().optional().default(false),
    // Multiple-choice
    options: z.array(optionSchema).optional().default([]),
    // File upload
    allowedFileTypes: z.array(z.string()).optional().default(['pdf', 'doc', 'docx']),
    maxFileSize: z.number().min(1).max(100).optional().default(10),
    isActive: z.boolean().optional().default(true),
})

const updateQuestionSchema = createQuestionSchema.partial().omit({ jobId: true })

const app = new Hono()

// Create new question
app.post('/add', async (c) => {
    try {
        await dbConnect()
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

        const validation = createQuestionSchema.safeParse(body)
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

        // Get the next order number for this job
        const lastQuestion = await Question.findOne({ jobId: validation.data.jobId })
            .sort({ order: -1 })
            .select('order')
        
        const nextOrder = validation.data.order || (lastQuestion ? lastQuestion.order + 1 : 0)

        const question = await Question.create({
            ...validation.data,
            order: nextOrder,
        })

        return c.json(
            {
                success: true,
                message: 'Question created successfully',
                question: {
                    id: question._id.toString(),
                    type: question.type,
                    text: question.text,
                    order: question.order,
                },
            },
            201
        )
    } catch (error) {
        console.error('Create question error:', error)
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

// Get questions by job ID
app.get('/by-job/:jobId', async (c) => {
    try {
        await dbConnect()
        const jobId = c.req.param('jobId')
        const includeInactive = c.req.query('includeInactive') === 'true'

        const query: Record<string, unknown> = { jobId }
        if (!includeInactive) {
            query.isActive = true
        }

        const questions = await Question.find(query).sort({ order: 1 })

        return c.json({
            success: true,
            questions: questions.map((q) => ({
                id: q._id.toString(),
                jobId: q.jobId.toString(),
                type: q.type,
                text: q.text,
                description: q.description,
                isRequired: q.isRequired,
                order: q.order,
                timeLimit: q.timeLimit,
                allowRetake: q.allowRetake,
                showQuestionBeforeRecording: q.showQuestionBeforeRecording,
                options: q.options,
                allowedFileTypes: q.allowedFileTypes,
                maxFileSize: q.maxFileSize,
                isActive: q.isActive,
                createdAt: q.createdAt,
            })),
            total: questions.length,
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

// Get single question
app.get('/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')

        const question = await Question.findById(id)

        if (!question) {
            return c.json(
                {
                    success: false,
                    error: 'Question not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            question: {
                id: question._id.toString(),
                jobId: question.jobId.toString(),
                type: question.type,
                text: question.text,
                description: question.description,
                isRequired: question.isRequired,
                order: question.order,
                timeLimit: question.timeLimit,
                allowRetake: question.allowRetake,
                showQuestionBeforeRecording: question.showQuestionBeforeRecording,
                options: question.options,
                allowedFileTypes: question.allowedFileTypes,
                maxFileSize: question.maxFileSize,
                isActive: question.isActive,
                createdAt: question.createdAt,
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

// Update question
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

        const validation = updateQuestionSchema.safeParse(body)
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

        const question = await Question.findById(id)
        if (!question) {
            return c.json(
                {
                    success: false,
                    error: 'Question not found',
                },
                404
            )
        }

        Object.assign(question, validation.data)
        await question.save()

        return c.json({
            success: true,
            message: 'Question updated successfully',
            question: {
                id: question._id.toString(),
                type: question.type,
                text: question.text,
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

// Reorder questions
app.post('/reorder', async (c) => {
    try {
        await dbConnect()
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

        const reorderSchema = z.object({
            questions: z.array(
                z.object({
                    id: z.string(),
                    order: z.number().min(0),
                })
            ),
        })

        const validation = reorderSchema.safeParse(body)
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

        const bulkOps = validation.data.questions.map((q) => ({
            updateOne: {
                filter: { _id: q.id },
                update: { $set: { order: q.order } },
            },
        }))

        await Question.bulkWrite(bulkOps)

        return c.json({
            success: true,
            message: 'Questions reordered successfully',
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

// Delete question
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

        const question = await Question.findById(id)
        if (!question) {
            return c.json(
                {
                    success: false,
                    error: 'Question not found',
                },
                404
            )
        }

        await Question.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'Question deleted successfully',
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

