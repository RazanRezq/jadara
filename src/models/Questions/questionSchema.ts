import mongoose, { Document, Model, Schema } from 'mongoose'

export type QuestionType = 'text' | 'voice' | 'multiple-choice' | 'file-upload'

export interface IQuestionOption {
    label: string
    value: string
}

export interface IQuestion extends Document {
    _id: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    type: QuestionType
    text: string
    description?: string
    isRequired: boolean
    order: number
    // Voice-specific settings
    timeLimit?: number // in seconds
    allowRetake: boolean
    showQuestionBeforeRecording: boolean
    // Multiple-choice options
    options?: IQuestionOption[]
    // File upload settings
    allowedFileTypes?: string[]
    maxFileSize?: number // in MB
    // Metadata
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const optionSchema = new Schema<IQuestionOption>(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
)

const questionSchema = new Schema<IQuestion>(
    {
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['text', 'voice', 'multiple-choice', 'file-upload'],
            required: [true, 'Question type is required'],
        },
        text: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isRequired: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        // Voice settings
        timeLimit: {
            type: Number,
            min: 30, // minimum 30 seconds
            max: 600, // maximum 10 minutes
            default: 180, // 3 minutes default
        },
        allowRetake: {
            type: Boolean,
            default: false,
        },
        showQuestionBeforeRecording: {
            type: Boolean,
            default: false, // "blind" questions by default
        },
        // Multiple-choice
        options: {
            type: [optionSchema],
            default: [],
        },
        // File upload
        allowedFileTypes: {
            type: [String],
            default: ['pdf', 'doc', 'docx'],
        },
        maxFileSize: {
            type: Number,
            default: 10, // 10 MB default
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

// Compound index for efficient queries
questionSchema.index({ jobId: 1, order: 1 })
questionSchema.index({ jobId: 1, type: 1 })

const Question: Model<IQuestion> =
    mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema)

export default Question

