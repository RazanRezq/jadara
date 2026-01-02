import mongoose, { Document, Model, Schema } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// THE "GOLDEN LIST" - EXACTLY 5 STATUSES
// These are the ONLY valid statuses in the system. No exceptions.
// ═══════════════════════════════════════════════════════════════════════════════
export type ApplicantStatus =
    | 'new'           // Just submitted, AI scored but awaiting human review
    | 'evaluated'     // Reviewed by a team member (replaces: screening, shortlisted)
    | 'interview'     // In interview process (canonical name)
    | 'hired'         // Final positive outcome
    | 'rejected'      // Final negative outcome (includes: withdrawn)

// Legacy status mapping (for API layer transformation)
export const LEGACY_STATUS_MAP: Record<string, ApplicantStatus> = {
    'screening': 'evaluated',     // Legacy: map to evaluated
    'interviewing': 'interview',  // Legacy: normalize to interview
    'shortlisted': 'evaluated',   // Legacy: map to evaluated
    'withdrawn': 'rejected',      // Legacy: treat as rejected
}

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
    screeningAnswers?: Record<string, boolean>
    languageProficiency?: Record<string, string>
}

// AI Evaluation status - tracks background evaluation progress
export type EvaluationStatus = 'pending' | 'processing' | 'completed' | 'failed'

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
    evaluationStatus: EvaluationStatus // Background evaluation status
    evaluationError?: string // Error message if evaluation failed
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
        screeningAnswers: {
            type: Map,
            of: Boolean,
        },
        languageProficiency: {
            type: Map,
            of: String,
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
            // Golden List (5) + Legacy (4) for backwards compatibility
            // API layer normalizes legacy values to Golden List before sending to client
            enum: ['new', 'evaluated', 'interview', 'hired', 'rejected', 'screening', 'interviewing', 'shortlisted', 'withdrawn'],
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
        evaluationStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        evaluationError: {
            type: String,
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

// Indexes for common queries - optimized for list/filter operations
applicantSchema.index({ jobId: 1, status: 1 })
applicantSchema.index({ jobId: 1, aiScore: -1 })
applicantSchema.index({ 'personalData.email': 1, jobId: 1 })
applicantSchema.index({ createdAt: -1 })
applicantSchema.index({ status: 1, createdAt: -1 }) // For filtering by status across all jobs
applicantSchema.index({ isComplete: 1, status: 1 }) // For finding incomplete applications
applicantSchema.index({ jobId: 1, status: 1, createdAt: -1 }) // For sorted filtered list

const Applicant: Model<IApplicant> =
    mongoose.models.Applicant || mongoose.model<IApplicant>('Applicant', applicantSchema)

export default Applicant

