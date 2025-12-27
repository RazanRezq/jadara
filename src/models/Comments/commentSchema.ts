import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IComment extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    authorId: mongoose.Types.ObjectId  // User who posted the comment
    // Content
    content: string
    // Optional: mentions and reactions
    mentions?: mongoose.Types.ObjectId[]  // Users mentioned in the comment
    // Visibility (future use)
    isPrivate?: boolean  // If true, only visible to author
    // Metadata
    createdAt: Date
    updatedAt: Date
}

const commentSchema = new Schema<IComment>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: 'Applicant',
            required: [true, 'Applicant ID is required'],
            index: true,
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author ID is required'],
        },
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            trim: true,
            maxlength: 2000,
        },
        mentions: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

// Indexes for common queries
commentSchema.index({ applicantId: 1, createdAt: -1 })
commentSchema.index({ authorId: 1, createdAt: -1 })

const Comment: Model<IComment> =
    mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema)

export default Comment
