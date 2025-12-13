import mongoose, { Document, Model, Schema } from 'mongoose'

export type JobStatus = 'draft' | 'active' | 'closed' | 'archived'

export interface ICriteria {
    name: string
    description: string
    weight: number // 1-10
    required: boolean
}

export interface IJob extends Document {
    _id: mongoose.Types.ObjectId
    title: string
    description: string
    department: string
    location: string
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
    salaryMin?: number
    salaryMax?: number
    requiredSkills: string[]
    responsibilities: string[]
    criteria: ICriteria[]
    status: JobStatus
    expiresAt?: Date
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

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
            enum: ['full-time', 'part-time', 'contract', 'internship'],
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

