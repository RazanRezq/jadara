import mongoose, { Document, Model, Schema } from 'mongoose'

export type RecommendationType = 'hire' | 'hold' | 'reject' | 'pending'

// Bilingual content types for evaluation
export interface IBilingualText {
    en: string
    ar: string
}

export interface IBilingualTextArray {
    en: string[]
    ar: string[]
}

export interface ICriteriaMatch {
    criteriaName: string
    matched: boolean
    score: number // 0-100
    weight: number // 1-10 importance
    reason: IBilingualText // Bilingual reason
    evidence?: IBilingualTextArray // Supporting evidence (bilingual)
}

export interface IEvaluation extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    // AI Scores
    overallScore: number // 0-100
    criteriaMatches: ICriteriaMatch[]
    // Analysis (bilingual)
    strengths: IBilingualTextArray
    weaknesses: IBilingualTextArray
    redFlags: IBilingualTextArray
    summary: IBilingualText
    // Recommendation (bilingual)
    recommendation: RecommendationType
    recommendationReason: IBilingualText
    // Interview preparation (bilingual)
    suggestedQuestions: IBilingualTextArray // AI-generated follow-up questions
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

// Sub-schema for bilingual text
const bilingualTextSchema = new Schema<IBilingualText>(
    {
        en: { type: String, default: '' },
        ar: { type: String, default: '' },
    },
    { _id: false }
)

// Sub-schema for bilingual text array
const bilingualTextArraySchema = new Schema<IBilingualTextArray>(
    {
        en: { type: [String], default: [] },
        ar: { type: [String], default: [] },
    },
    { _id: false }
)

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
        weight: {
            type: Number,
            min: 1,
            max: 10,
            default: 5,
        },
        reason: {
            type: bilingualTextSchema,
            required: true,
        },
        evidence: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
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
        // Analysis (bilingual)
        strengths: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        weaknesses: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        redFlags: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        summary: {
            type: bilingualTextSchema,
            default: () => ({ en: '', ar: '' }),
        },
        // Recommendation
        recommendation: {
            type: String,
            enum: ['hire', 'hold', 'reject', 'pending'],
            default: 'pending',
        },
        recommendationReason: {
            type: bilingualTextSchema,
            default: () => ({ en: '', ar: '' }),
        },
        // Interview prep (bilingual)
        suggestedQuestions: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
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

// In development, delete cached model to allow schema changes
// This is necessary because Next.js hot-reloading caches Mongoose models
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Evaluation
}

const Evaluation: Model<IEvaluation> =
    mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', evaluationSchema)

export default Evaluation

