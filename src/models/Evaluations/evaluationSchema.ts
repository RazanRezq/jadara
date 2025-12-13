import mongoose, { Document, Model, Schema } from 'mongoose'

export type RecommendationType = 'hire' | 'hold' | 'reject' | 'pending'

export interface ICriteriaMatch {
    criteriaName: string
    matched: boolean
    score: number // 0-100
    reason: string
}

export interface IEvaluation extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    // AI Scores
    overallScore: number // 0-100
    criteriaMatches: ICriteriaMatch[]
    // Analysis
    strengths: string[]
    weaknesses: string[]
    redFlags: string[]
    summary: string
    // Recommendation
    recommendation: RecommendationType
    recommendationReason: string
    // Interview preparation
    suggestedQuestions: string[] // AI-generated follow-up questions
    // Sentiment analysis (from voice)
    sentimentScore?: number // -1 to 1
    confidenceScore?: number // 0-100
    // Processing status
    isProcessed: boolean
    processingError?: string
    processedAt?: Date
    // Manual override
    manualRecommendation?: RecommendationType
    manualNotes?: string
    reviewedBy?: mongoose.Types.ObjectId
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const criteriaMatchSchema = new Schema<ICriteriaMatch>(
    {
        criteriaName: {
            type: String,
            required: true,
        },
        matched: {
            type: Boolean,
            required: true,
        },
        score: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
    },
    { _id: false }
)

const evaluationSchema = new Schema<IEvaluation>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: 'Applicant',
            required: [true, 'Applicant ID is required'],
            unique: true,
            index: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job ID is required'],
            index: true,
        },
        // Scores
        overallScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        criteriaMatches: {
            type: [criteriaMatchSchema],
            default: [],
        },
        // Analysis
        strengths: {
            type: [String],
            default: [],
        },
        weaknesses: {
            type: [String],
            default: [],
        },
        redFlags: {
            type: [String],
            default: [],
        },
        summary: {
            type: String,
            default: '',
        },
        // Recommendation
        recommendation: {
            type: String,
            enum: ['hire', 'hold', 'reject', 'pending'],
            default: 'pending',
        },
        recommendationReason: {
            type: String,
            default: '',
        },
        // Interview prep
        suggestedQuestions: {
            type: [String],
            default: [],
        },
        // Sentiment
        sentimentScore: {
            type: Number,
            min: -1,
            max: 1,
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        // Processing
        isProcessed: {
            type: Boolean,
            default: false,
        },
        processingError: {
            type: String,
        },
        processedAt: {
            type: Date,
        },
        // Manual override
        manualRecommendation: {
            type: String,
            enum: ['hire', 'hold', 'reject', 'pending'],
        },
        manualNotes: {
            type: String,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Index for queries
evaluationSchema.index({ jobId: 1, overallScore: -1 })
evaluationSchema.index({ jobId: 1, recommendation: 1 })

const Evaluation: Model<IEvaluation> =
    mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', evaluationSchema)

export default Evaluation

