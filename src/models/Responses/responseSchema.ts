import mongoose, { Document, Model, Schema } from 'mongoose'

export type ResponseType = 'text' | 'voice' | 'multiple-choice' | 'file'

export interface IResponse extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    questionId: mongoose.Types.ObjectId
    type: ResponseType
    // Text response
    textAnswer?: string
    // Voice response
    audioUrl?: string
    rawTranscript?: string      // Verbatim transcription
    cleanTranscript?: string    // Cleaned transcription (removed umm, ahh, grammar corrected)
    audioDuration?: number      // in seconds
    // Multiple-choice
    selectedOption?: string
    // File upload
    fileUrl?: string
    fileName?: string
    fileSize?: number           // in bytes
    // Timing
    startedAt?: Date
    completedAt?: Date
    timeSpent?: number          // in seconds
    // Flags
    isAutoSubmitted: boolean    // Timer ran out
    hasRecordingIssue: boolean  // Technical issues
    // Reviewer rating
    reviewerRating?: number     // 1-5 stars
    reviewerNotes?: string
    reviewedBy?: mongoose.Types.ObjectId
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const responseSchema = new Schema<IResponse>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: 'Applicant',
            required: [true, 'Applicant ID is required'],
            index: true,
        },
        questionId: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
            required: [true, 'Question ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['text', 'voice', 'multiple-choice', 'file'],
            required: [true, 'Response type is required'],
        },
        // Text
        textAnswer: {
            type: String,
            trim: true,
        },
        // Voice
        audioUrl: {
            type: String,
            trim: true,
        },
        rawTranscript: {
            type: String,
        },
        cleanTranscript: {
            type: String,
        },
        audioDuration: {
            type: Number,
            min: 0,
        },
        // Multiple-choice
        selectedOption: {
            type: String,
        },
        // File
        fileUrl: {
            type: String,
            trim: true,
        },
        fileName: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        // Timing
        startedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
        timeSpent: {
            type: Number,
            min: 0,
        },
        // Flags
        isAutoSubmitted: {
            type: Boolean,
            default: false,
        },
        hasRecordingIssue: {
            type: Boolean,
            default: false,
        },
        // Review
        reviewerRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        reviewerNotes: {
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

// Compound indexes
responseSchema.index({ applicantId: 1, questionId: 1 }, { unique: true })
responseSchema.index({ applicantId: 1, type: 1 })

const Response: Model<IResponse> =
    mongoose.models.Response || mongoose.model<IResponse>('Response', responseSchema)

export default Response

