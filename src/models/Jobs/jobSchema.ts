import mongoose, { Document, Model, Schema } from 'mongoose'

export type JobStatus = 'draft' | 'active' | 'closed' | 'archived'
export type SkillImportance = 'required' | 'preferred'
export type QuestionType = 'text' | 'voice'
export type TimeLimit = '30s' | '1min' | '2min' | '3min' | '5min'
export type Currency = 'SAR' | 'USD' | 'AED' | 'EGP'

export interface ISkill {
    name: string
    importance: SkillImportance
}

export interface IQuestion {
    text: string
    type: QuestionType
    weight: number // 1-10
    timeLimit?: TimeLimit // For voice questions
    hideTextUntilRecording?: boolean // For voice questions
}

export interface ICandidateDataConfig {
    requireCV: boolean
    requireLinkedIn: boolean
    requirePortfolio: boolean
    hideSalaryExpectation: boolean
    hidePersonalInfo: boolean
}

export interface IRetakePolicy {
    allowRetake: boolean
    maxAttempts: number
}

export interface ICriteria {
    name: string
    description: string
    weight: number // 1-10
    required: boolean
}

export interface IJob extends Document {
    _id: mongoose.Types.ObjectId
    // Step 1: Job Basics
    title: string
    description: string
    department: string
    location: string
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote'
    salaryMin?: number
    salaryMax?: number
    currency: Currency
    
    // Step 2: Evaluation Criteria
    skills: ISkill[]
    minExperience: number // Years
    autoRejectThreshold: number // Percentage (0-100)
    
    // Step 3: Candidate Data
    candidateDataConfig: ICandidateDataConfig
    
    // Step 4: Exam Builder
    candidateInstructions: string
    questions: IQuestion[]
    retakePolicy: IRetakePolicy
    
    // Legacy fields
    requiredSkills: string[]
    responsibilities: string[]
    criteria: ICriteria[]
    
    // Metadata
    status: JobStatus
    expiresAt?: Date
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const skillSchema = new Schema<ISkill>(
    {
        name: {
            type: String,
            required: [true, 'Skill name is required'],
            trim: true,
        },
        importance: {
            type: String,
            enum: ['required', 'preferred'],
            default: 'preferred',
        },
    },
    { _id: false }
)

const questionSchema = new Schema<IQuestion>(
    {
        text: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['text', 'voice'],
            default: 'text',
        },
        weight: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
            default: 5,
        },
        timeLimit: {
            type: String,
            enum: ['30s', '1min', '2min', '3min', '5min'],
        },
        hideTextUntilRecording: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
)

const candidateDataConfigSchema = new Schema<ICandidateDataConfig>(
    {
        requireCV: {
            type: Boolean,
            default: true,
        },
        requireLinkedIn: {
            type: Boolean,
            default: false,
        },
        requirePortfolio: {
            type: Boolean,
            default: false,
        },
        hideSalaryExpectation: {
            type: Boolean,
            default: false,
        },
        hidePersonalInfo: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
)

const retakePolicySchema = new Schema<IRetakePolicy>(
    {
        allowRetake: {
            type: Boolean,
            default: false,
        },
        maxAttempts: {
            type: Number,
            default: 1,
            min: 1,
            max: 5,
        },
    },
    { _id: false }
)

const criteriaSchema = new Schema<ICriteria>(
    {
        name: {
            type: String,
            required: [true, 'Criteria name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        weight: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
            default: 5,
        },
        required: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
)

const jobSchema = new Schema<IJob>(
    {
        // Step 1: Job Basics
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            minlength: [3, 'Job title must be at least 3 characters'],
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
            trim: true,
        },
        department: {
            type: String,
            trim: true,
            default: '',
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
        employmentType: {
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
            default: 'full-time',
        },
        salaryMin: {
            type: Number,
            min: 0,
        },
        salaryMax: {
            type: Number,
            min: 0,
        },
        currency: {
            type: String,
            enum: ['SAR', 'USD', 'AED', 'EGP'],
            default: 'SAR',
        },
        
        // Step 2: Evaluation Criteria
        skills: {
            type: [skillSchema],
            default: [],
        },
        minExperience: {
            type: Number,
            default: 0,
            min: 0,
            max: 20,
        },
        autoRejectThreshold: {
            type: Number,
            default: 35,
            min: 0,
            max: 100,
        },
        
        // Step 3: Candidate Data
        candidateDataConfig: {
            type: candidateDataConfigSchema,
            default: () => ({
                requireCV: true,
                requireLinkedIn: false,
                requirePortfolio: false,
                hideSalaryExpectation: false,
                hidePersonalInfo: false,
            }),
        },
        
        // Step 4: Exam Builder
        candidateInstructions: {
            type: String,
            trim: true,
            default: '',
        },
        questions: {
            type: [questionSchema],
            default: [],
        },
        retakePolicy: {
            type: retakePolicySchema,
            default: () => ({
                allowRetake: false,
                maxAttempts: 1,
            }),
        },
        
        // Legacy fields
        requiredSkills: {
            type: [String],
            default: [],
        },
        responsibilities: {
            type: [String],
            default: [],
        },
        criteria: {
            type: [criteriaSchema],
            default: [],
        },
        
        // Metadata
        status: {
            type: String,
            enum: ['draft', 'active', 'closed', 'archived'],
            default: 'draft',
        },
        expiresAt: {
            type: Date,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

// Index for searching jobs
jobSchema.index({ title: 'text', description: 'text' })
jobSchema.index({ status: 1, createdAt: -1 })

const Job: Model<IJob> =
    mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema)

export default Job
