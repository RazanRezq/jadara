import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Job, { IJob } from './jobSchema'

const criteriaSchema = z.object({
    name: z.string().min(1, 'Criteria name is required'),
    description: z.string().optional().default(''),
    weight: z.number().min(1).max(10).default(5),
    required: z.boolean().default(false),
})

const createJobSchema = z.object({
    title: z.string().min(3, 'Job title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    department: z.string().optional().default(''),
    location: z.string().optional().default(''),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).default('full-time'),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    requiredSkills: z.array(z.string()).optional().default([]),
    responsibilities: z.array(z.string()).optional().default([]),
    criteria: z.array(criteriaSchema).optional().default([]),
    status: z.enum(['draft', 'active', 'closed', 'archived']).default('draft'),
    expiresAt: z.string().datetime().optional(),
})

const updateJobSchema = createJobSchema.partial()

const app = new Hono()

// Create new job
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

        const validation = createJobSchema.safeParse(body)
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

        const jobData = {
            ...validation.data,
            createdBy: userId,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
        }

        const job = await Job.create(jobData)

        return c.json(
            {
                success: true,
                message: 'Job created successfully',
                job: {
                    id: job._id.toString(),
                    title: job.title,
                    status: job.status,
                    createdAt: job.createdAt,
                },
            },
            201
        )
    } catch (error) {
        console.error('Create job error:', error)
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

// Get all jobs with pagination and filtering
app.get('/list', async (c) => {
    try {
        await dbConnect()
        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '10')
        const searchTerm = c.req.query('search') || ''
        const status = c.req.query('status') || ''
        const department = c.req.query('department') || ''

        const query: Record<string, unknown> = {}

        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ]
        }

        if (status && status !== 'all') {
            query.status = status
        }

        if (department) {
            query.department = { $regex: department, $options: 'i' }
        }

        const skip = (page - 1) * limit
        const total = await Job.countDocuments(query)
        const jobs = await Job.find(query)
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        return c.json({
            success: true,
            jobs: jobs.map((job: IJob) => ({
                id: job._id.toString(),
                title: job.title,
                description: job.description,
                department: job.department,
                location: job.location,
                employmentType: job.employmentType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                requiredSkills: job.requiredSkills,
                responsibilities: job.responsibilities,
                criteria: job.criteria,
                status: job.status,
                expiresAt: job.expiresAt,
                createdBy: job.createdBy,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
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

// Get single job
app.get('/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')

        const job = await Job.findById(id).populate('createdBy', 'name email')

        if (!job) {
            return c.json(
                {
                    success: false,
                    error: 'Job not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            job: {
                id: job._id.toString(),
                title: job.title,
                description: job.description,
                department: job.department,
                location: job.location,
                employmentType: job.employmentType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                requiredSkills: job.requiredSkills,
                responsibilities: job.responsibilities,
                criteria: job.criteria,
                status: job.status,
                expiresAt: job.expiresAt,
                createdBy: job.createdBy,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
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

// Update job
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

        const validation = updateJobSchema.safeParse(body)
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

        const job = await Job.findById(id)
        if (!job) {
            return c.json(
                {
                    success: false,
                    error: 'Job not found',
                },
                404
            )
        }

        const updateData = {
            ...validation.data,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : job.expiresAt,
        }

        Object.assign(job, updateData)
        await job.save()

        return c.json({
            success: true,
            message: 'Job updated successfully',
            job: {
                id: job._id.toString(),
                title: job.title,
                status: job.status,
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

// Delete job
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

        const job = await Job.findById(id)
        if (!job) {
            return c.json(
                {
                    success: false,
                    error: 'Job not found',
                },
                404
            )
        }

        await Job.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'Job deleted successfully',
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

// Get job statistics
app.get('/stats/overview', async (c) => {
    try {
        await dbConnect()

        const [totalJobs, activeJobs, draftJobs, closedJobs] = await Promise.all([
            Job.countDocuments(),
            Job.countDocuments({ status: 'active' }),
            Job.countDocuments({ status: 'draft' }),
            Job.countDocuments({ status: 'closed' }),
        ])

        return c.json({
            success: true,
            stats: {
                total: totalJobs,
                active: activeJobs,
                draft: draftJobs,
                closed: closedJobs,
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

