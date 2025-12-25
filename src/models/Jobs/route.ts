import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Job from './jobSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'

const criteriaSchema = z.object({
    name: z.string().min(1, 'Criteria name is required'),
    description: z.string().optional().default(''),
    weight: z.number().min(1).max(10).default(5),
    required: z.boolean().default(false),
})

const skillSchema = z.object({
    name: z.string().min(1, 'Skill name is required'),
    importance: z.enum(['required', 'preferred']).default('preferred'),
    type: z.enum(['technical', 'soft']).optional(),
    reason: z.enum(['explicit', 'inferred']).optional(),
})

const screeningQuestionSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    disqualify: z.boolean().default(false),
})

const languageSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'native']).default('intermediate'),
})

const questionSchema = z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['text', 'voice']).default('text'),
    weight: z.number().min(1).max(10).default(5),
    timeLimit: z.enum(['30s', '1min', '2min', '3min', '5min']).optional(),
    hideTextUntilRecording: z.boolean().optional().default(false),
})

const candidateDataConfigSchema = z.object({
    requireCV: z.boolean().default(true),
    requireLinkedIn: z.boolean().default(false),
    requirePortfolio: z.boolean().default(false),
    hideSalaryExpectation: z.boolean().default(false),
    hidePersonalInfo: z.boolean().default(false),
})

const retakePolicySchema = z.object({
    allowRetake: z.boolean().default(false),
    maxAttempts: z.number().min(1).max(5).default(1),
})

const createJobSchema = z.object({
    title: z.string().min(3, 'Job title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    department: z.string().optional().default(''),
    location: z.string().optional().default(''),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).default('full-time'),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    currency: z.enum(['SAR', 'USD', 'AED', 'EGP', 'TRY']).optional().default('USD'),
    // Step 2: Evaluation Criteria
    skills: z.array(skillSchema).optional().default([]),
    screeningQuestions: z.array(screeningQuestionSchema).optional().default([]),
    languages: z.array(languageSchema).optional().default([]),
    minExperience: z.number().min(0).max(20).optional().default(0),
    autoRejectThreshold: z.number().min(0).max(100).optional().default(35),
    // Step 3: Candidate Data
    candidateDataConfig: candidateDataConfigSchema.optional().default({
        requireCV: true,
        requireLinkedIn: false,
        requirePortfolio: false,
        hideSalaryExpectation: false,
        hidePersonalInfo: false,
    }),
    // Step 4: Exam Builder
    candidateInstructions: z.string().optional().default(''),
    questions: z.array(questionSchema).optional().default([]),
    retakePolicy: retakePolicySchema.optional().default({
        allowRetake: false,
        maxAttempts: 1,
    }),
    // Legacy fields
    requiredSkills: z.array(z.string()).optional().default([]),
    responsibilities: z.array(z.string()).optional().default([]),
    criteria: z.array(criteriaSchema).optional().default([]),
    status: z.enum(['draft', 'active', 'closed', 'archived']).default('draft'),
    expiresAt: z.string().datetime().optional(),
})

const updateJobSchema = createJobSchema.partial()

const app = new Hono()

// Create new job (admin only)
app.post('/add', authenticate, requireRole('admin'), async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()
        const user = getAuthUser(c)

        if (!user.userId) {
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
            // Extract meaningful field errors from Zod validation
            const issues = validation.error.issues
            const fieldErrors: Record<string, string[]> = {}
            
            // Process each issue to get user-friendly error messages
            for (const issue of issues) {
                const path = issue.path
                // Get the top-level field name (e.g., "languages" from ["languages", 0, "language"])
                const fieldName = String(path[0] || 'form')
                
                if (!fieldErrors[fieldName]) {
                    fieldErrors[fieldName] = []
                }
                
                // Add the error message if not already added
                if (!fieldErrors[fieldName].includes(issue.message)) {
                    fieldErrors[fieldName].push(issue.message)
                }
            }
            
            console.error('[Job Creation] Validation failed:', JSON.stringify(fieldErrors, null, 2))
            
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: fieldErrors,
                },
                400
            )
        }

        const jobData = {
            ...validation.data,
            createdBy: user.userId,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
        }

        const job = await Job.create(jobData)

        // Log job creation
        await logUserAction(
            user,
            'job.created',
            'Job',
            job._id.toString(),
            `Created job: ${job.title}`,
            {
                resourceName: job.title,
                metadata: {
                    department: job.department,
                    location: job.location,
                    type: job.employmentType,
                    status: job.status,
                },
                severity: 'info',
            }
        )

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
app.get('/list', authenticate, async (c) => {
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
            .select('title description department location employmentType salaryMin salaryMax currency skills minExperience autoRejectThreshold candidateDataConfig candidateInstructions questions retakePolicy requiredSkills responsibilities criteria status expiresAt createdBy createdAt updatedAt')
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean()

        // Import Applicant model to count applicants
        const Applicant = (await import('../Applicants/applicantSchema')).default

        // Get applicant counts for all jobs in this page
        const jobIds = jobs.map(job => job._id)
        const applicantCounts = await Applicant.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$jobId', count: { $sum: 1 } } }
        ])

        // Create a map for quick lookup
        const countsMap = new Map(
            applicantCounts.map(item => [String(item._id), item.count])
        )

        return c.json({
            success: true,
            jobs: jobs.map((job) => ({
                id: String(job._id),
                title: job.title,
                description: job.description,
                department: job.department,
                location: job.location,
                employmentType: job.employmentType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                currency: job.currency,
                // Step 2: Evaluation Criteria
                skills: job.skills,
                minExperience: job.minExperience,
                autoRejectThreshold: job.autoRejectThreshold,
                // Step 3: Candidate Data
                candidateDataConfig: job.candidateDataConfig,
                // Step 4: Exam Builder
                candidateInstructions: job.candidateInstructions,
                questions: job.questions,
                retakePolicy: job.retakePolicy,
                // Legacy fields
                requiredSkills: job.requiredSkills,
                responsibilities: job.responsibilities,
                criteria: job.criteria,
                status: job.status,
                expiresAt: job.expiresAt,
                createdBy: job.createdBy,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
                // Applicants count
                applicantsCount: countsMap.get(String(job._id)) || 0,
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
app.get('/:id', authenticate, async (c) => {
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
                currency: job.currency,
                // Step 2: Evaluation Criteria
                skills: Array.isArray(job.skills) ? job.skills : [],
                screeningQuestions: Array.isArray(job.screeningQuestions) ? job.screeningQuestions : [],
                languages: Array.isArray(job.languages) ? job.languages : [],
                minExperience: job.minExperience,
                autoRejectThreshold: job.autoRejectThreshold,
                // Step 3: Candidate Data
                candidateDataConfig: job.candidateDataConfig,
                // Step 4: Exam Builder
                candidateInstructions: job.candidateInstructions,
                questions: job.questions,
                retakePolicy: job.retakePolicy,
                // Legacy fields
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

// Update job (PATCH endpoint)
app.patch('/:id', authenticate, requireRole('admin'), async (c) => {
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
            // Extract meaningful field errors from Zod validation
            const issues = validation.error.issues
            const fieldErrors: Record<string, string[]> = {}

            for (const issue of issues) {
                const path = issue.path
                const fieldName = String(path[0] || 'form')

                if (!fieldErrors[fieldName]) {
                    fieldErrors[fieldName] = []
                }

                if (!fieldErrors[fieldName].includes(issue.message)) {
                    fieldErrors[fieldName].push(issue.message)
                }
            }

            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: fieldErrors,
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

        // Reload the job to get all fields
        const updatedJob = await Job.findById(id).populate('createdBy', 'name email')

        // Log job update
        const user = getAuthUser(c)
        if (user && user.userId) {
            await logUserAction(
                user,
                'job.updated',
                'Job',
                job._id.toString(),
                `Updated job: ${job.title}`,
                {
                    resourceName: job.title,
                    metadata: {
                        department: job.department,
                        location: job.location,
                        status: job.status,
                    },
                    severity: 'info',
                }
            )
        }

        return c.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob ? {
                id: updatedJob._id.toString(),
                title: updatedJob.title,
                description: updatedJob.description,
                department: updatedJob.department,
                location: updatedJob.location,
                employmentType: updatedJob.employmentType,
                salaryMin: updatedJob.salaryMin,
                salaryMax: updatedJob.salaryMax,
                currency: updatedJob.currency,
                // Step 2: Evaluation Criteria
                skills: updatedJob.skills,
                screeningQuestions: updatedJob.screeningQuestions,
                languages: updatedJob.languages,
                minExperience: updatedJob.minExperience,
                autoRejectThreshold: updatedJob.autoRejectThreshold,
                // Step 3: Candidate Data
                candidateDataConfig: updatedJob.candidateDataConfig,
                // Step 4: Exam Builder
                candidateInstructions: updatedJob.candidateInstructions,
                questions: updatedJob.questions,
                retakePolicy: updatedJob.retakePolicy,
                // Legacy fields
                requiredSkills: updatedJob.requiredSkills,
                responsibilities: updatedJob.responsibilities,
                criteria: updatedJob.criteria,
                status: updatedJob.status,
                expiresAt: updatedJob.expiresAt,
                createdBy: updatedJob.createdBy,
                createdAt: updatedJob.createdAt,
                updatedAt: updatedJob.updatedAt,
            } : null,
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

// Update job (POST endpoint - kept for backward compatibility)
app.post('/update/:id', authenticate, requireRole('admin'), async (c) => {
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

        // Reload the job to get all fields
        const updatedJob = await Job.findById(id).populate('createdBy', 'name email')

        // Log job update
        const user = getAuthUser(c)
        if (user && user.userId) {
            await logUserAction(
                user,
                'job.updated',
                'Job',
                job._id.toString(),
                `Updated job: ${job.title}`,
                {
                    resourceName: job.title,
                    metadata: {
                        department: job.department,
                        location: job.location,
                        status: job.status,
                    },
                    severity: 'info',
                }
            )
        }

        return c.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob ? {
                id: updatedJob._id.toString(),
                title: updatedJob.title,
                description: updatedJob.description,
                department: updatedJob.department,
                location: updatedJob.location,
                employmentType: updatedJob.employmentType,
                salaryMin: updatedJob.salaryMin,
                salaryMax: updatedJob.salaryMax,
                currency: updatedJob.currency,
                // Step 2: Evaluation Criteria
                skills: updatedJob.skills,
                minExperience: updatedJob.minExperience,
                autoRejectThreshold: updatedJob.autoRejectThreshold,
                // Step 3: Candidate Data
                candidateDataConfig: updatedJob.candidateDataConfig,
                // Step 4: Exam Builder
                candidateInstructions: updatedJob.candidateInstructions,
                questions: updatedJob.questions,
                retakePolicy: updatedJob.retakePolicy,
                // Legacy fields
                requiredSkills: updatedJob.requiredSkills,
                responsibilities: updatedJob.responsibilities,
                criteria: updatedJob.criteria,
                status: updatedJob.status,
                expiresAt: updatedJob.expiresAt,
                createdBy: updatedJob.createdBy,
                createdAt: updatedJob.createdAt,
                updatedAt: updatedJob.updatedAt,
            } : null,
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

// Toggle job status (quick action for active/closed)
app.post('/toggle-status/:id', authenticate, requireRole('admin'), async (c) => {
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

        // Toggle between active and closed
        const oldStatus = job.status
        const newStatus = job.status === 'active' ? 'closed' : 'active'
        job.status = newStatus
        await job.save()

        const updatedJob = await Job.findById(id).populate('createdBy', 'name email')

        // Log job status change
        const user = getAuthUser(c)
        if (user && user.userId) {
            const action = newStatus === 'active' ? 'job.published' : 'job.closed'
            await logUserAction(
                user,
                action,
                'Job',
                job._id.toString(),
                `Changed job status from ${oldStatus} to ${newStatus}: ${job.title}`,
                {
                    resourceName: job.title,
                    metadata: {
                        oldStatus,
                        newStatus,
                        department: job.department,
                        location: job.location,
                    },
                    severity: 'info',
                }
            )
        }

        return c.json({
            success: true,
            message: `Job status changed to ${newStatus}`,
            job: updatedJob ? {
                id: updatedJob._id.toString(),
                title: updatedJob.title,
                description: updatedJob.description,
                department: updatedJob.department,
                location: updatedJob.location,
                employmentType: updatedJob.employmentType,
                salaryMin: updatedJob.salaryMin,
                salaryMax: updatedJob.salaryMax,
                currency: updatedJob.currency,
                skills: updatedJob.skills,
                minExperience: updatedJob.minExperience,
                autoRejectThreshold: updatedJob.autoRejectThreshold,
                candidateDataConfig: updatedJob.candidateDataConfig,
                candidateInstructions: updatedJob.candidateInstructions,
                questions: updatedJob.questions,
                retakePolicy: updatedJob.retakePolicy,
                requiredSkills: updatedJob.requiredSkills,
                responsibilities: updatedJob.responsibilities,
                criteria: updatedJob.criteria,
                status: updatedJob.status,
                expiresAt: updatedJob.expiresAt,
                createdBy: updatedJob.createdBy,
                createdAt: updatedJob.createdAt,
                updatedAt: updatedJob.updatedAt,
            } : null,
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
app.delete('/delete/:id', authenticate, requireRole('admin'), async (c) => {
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

        // Store job details before deletion for audit log
        const jobTitle = job.title
        const jobDepartment = job.department
        const jobLocation = job.location
        const jobId = job._id.toString()

        await Job.findByIdAndDelete(id)

        // Log job deletion
        const user = getAuthUser(c)
        if (user && user.userId) {
            await logUserAction(
                user,
                'job.deleted',
                'Job',
                jobId,
                `Deleted job: ${jobTitle}`,
                {
                    resourceName: jobTitle,
                    metadata: {
                        department: jobDepartment,
                        location: jobLocation,
                    },
                    severity: 'warning',
                }
            )
        }

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
app.get('/stats/overview', authenticate, async (c) => {
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

// Get actionable stats for HR dashboard
app.get('/stats/actionable', authenticate, async (c) => {
    try {
        await dbConnect()

        // Import Applicant model
        const Applicant = (await import('../Applicants/applicantSchema')).default

        // Get active job IDs
        const activeJobs = await Job.find({ status: 'active' }).select('_id').lean()
        const activeJobIds = activeJobs.map(job => job._id)

        // Count applicants with status 'new' across all active jobs
        const needsReviewCount = activeJobIds.length > 0
            ? await Applicant.countDocuments({
                jobId: { $in: activeJobIds },
                status: 'new',
            })
            : 0

        // Count applicants with AI Score > 80% (across all jobs)
        const topTalentCount = await Applicant.countDocuments({
            aiScore: { $gt: 80 },
        })

        // Count active jobs
        const activeJobsCount = activeJobIds.length

        return c.json({
            success: true,
            stats: {
                needsReview: needsReviewCount,
                topTalent: topTalentCount,
                activeJobs: activeJobsCount,
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

