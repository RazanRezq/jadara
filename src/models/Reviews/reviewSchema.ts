import mongoose, { Document, Model, Schema } from 'mongoose'

export type ReviewDecision =
    | 'strong_hire'        // Definitely should hire
    | 'recommended'        // Good candidate, should proceed
    | 'neutral'            // Neither strong nor weak
    | 'not_recommended'    // Should not proceed
    | 'strong_no'          // Definitely should not hire

export interface IReview extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    reviewerId: mongoose.Types.ObjectId  // User who submitted review
    // Rating & Decision
    rating: number           // 1-5 stars
    decision: ReviewDecision
    // Detailed Feedback
    pros: string[]          // Bullet points of positives
    cons: string[]          // Bullet points of negatives
    privateNotes?: string   // Private notes (not visible to other reviewers)
    summary?: string        // Brief summary
    // Skills Assessment (optional per-skill ratings)
    skillRatings?: Record<string, number>  // e.g., { "JavaScript": 4, "Communication": 5 }
    // Metadata
    createdAt: Date
    updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: 'Applicant',
            required: [true, 'Applicant ID is required'],
            index: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job ID is required'],
            index: true,
        },
        reviewerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reviewer ID is required'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        decision: {
            type: String,
            enum: ['strong_hire', 'recommended', 'neutral', 'not_recommended', 'strong_no'],
            required: [true, 'Decision is required'],
        },
        pros: {
            type: [String],
            default: [],
        },
        cons: {
            type: [String],
            default: [],
        },
        privateNotes: {
            type: String,
            trim: true,
        },
        summary: {
            type: String,
            trim: true,
        },
        skillRatings: {
            type: Map,
            of: Number,
        },
    },
    {
        timestamps: true,
    }
)

// Compound index to ensure one review per reviewer per applicant
reviewSchema.index({ applicantId: 1, reviewerId: 1 }, { unique: true })
reviewSchema.index({ applicantId: 1, createdAt: -1 })
reviewSchema.index({ reviewerId: 1, createdAt: -1 })

const Review: Model<IReview> =
    mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema)

export default Review
