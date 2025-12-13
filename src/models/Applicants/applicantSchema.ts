import mongoose, { Document, Model, Schema } from 'mongoose'

export type ApplicantStatus = 
    | 'new'           // Just submitted
    | 'screening'     // Under initial review
    | 'interviewing'  // In interview process
    | 'evaluated'     // AI/Human evaluation done
    | 'shortlisted'   // Made it to shortlist
    | 'hired'         // Got the job
    | 'rejected'      // Did not pass
    | 'withdrawn'     // Candidate withdrew

export interface IPersonalData {
    name: string
    email: string
    phone: string
    age?: number
    major?: string
    yearsOfExperience?: number
    salaryExpectation?: number // Hidden from reviewers
    linkedinUrl?: string
    behanceUrl?: string
    portfolioUrl?: string
}

export interface IApplicant extends Document {
    _id: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    personalData: IPersonalData
    cvUrl?: string
    cvParsedData?: Record<string, unknown>
    status: ApplicantStatus
    tags: string[]
    notes: string
    // AI Evaluation
    aiScore?: number // 0-100
    aiSummary?: string
    aiRedFlags?: string[] // Hidden from reviewers
    // Session tracking
    sessionId: string
    isComplete: boolean
    submittedAt?: Date
    // Flags
    isSuspicious: boolean
    suspiciousReason?: string
    // Metadata
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
}

const personalDataSchema = new Schema<IPersonalData>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone is required'],
            trim: true,
        },
        age: {
            type: Number,
            min: 16,
            max: 100,
        },
        major: {
            type: String,
            trim: true,
        },
        yearsOfExperience: {
            type: Number,
            min: 0,
            max: 50,
        },
        salaryExpectation: {
            type: Number,
            min: 0,
        },
        linkedinUrl: {
            type: String,
            trim: true,
        },
        behanceUrl: {
            type: String,
            trim: true,
        },
        portfolioUrl: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
)

const applicantSchema = new Schema<IApplicant>(
    {
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job ID is required'],
            index: true,
        },
        personalData: {
            type: personalDataSchema,
            required: true,
        },
        cvUrl: {
            type: String,
            trim: true,
        },
        cvParsedData: {
            type: Schema.Types.Mixed,
        },
        status: {
            type: String,
            enum: ['new', 'screening', 'interviewing', 'evaluated', 'shortlisted', 'hired', 'rejected', 'withdrawn'],
            default: 'new',
        },
        tags: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            default: '',
        },
        // AI Evaluation
        aiScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        aiSummary: {
            type: String,
        },
        aiRedFlags: {
            type: [String],
            default: [],
        },
        // Session
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },
        isComplete: {
            type: Boolean,
            default: false,
        },
        submittedAt: {
            type: Date,
        },
        // Flags
        isSuspicious: {
            type: Boolean,
            default: false,
        },
        suspiciousReason: {
            type: String,
        },
        // Metadata
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
)

// Indexes for common queries
applicantSchema.index({ jobId: 1, status: 1 })
applicantSchema.index({ jobId: 1, aiScore: -1 })
applicantSchema.index({ 'personalData.email': 1, jobId: 1 })
applicantSchema.index({ createdAt: -1 })

const Applicant: Model<IApplicant> =
    mongoose.models.Applicant || mongoose.model<IApplicant>('Applicant', applicantSchema)

export default Applicant

