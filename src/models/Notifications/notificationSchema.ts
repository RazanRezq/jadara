import mongoose, { Document, Model, Schema } from 'mongoose'

export type NotificationType =
    | 'new_applicant'
    | 'review_assigned'
    | 'review_completed'
    | 'comment_added'
    | 'applicant_hired'
    | 'job_expired'
    | 'system_alert'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId // Recipient user
    type: NotificationType
    priority: NotificationPriority
    title: string
    message: string
    actionUrl?: string // Optional link to related resource
    relatedId?: mongoose.Types.ObjectId // Related applicant/job/evaluation ID
    isRead: boolean
    readAt?: Date
    createdAt: Date
    updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['new_applicant', 'review_assigned', 'review_completed', 'comment_added', 'applicant_hired', 'job_expired', 'system_alert'],
            required: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
        },
        actionUrl: {
            type: String,
            trim: true,
        },
        relatedId: {
            type: Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Indexes for common queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }) // For fetching user notifications
notificationSchema.index({ userId: 1, type: 1 }) // For filtering by type
notificationSchema.index({ createdAt: -1 }) // For sorting by date
notificationSchema.index({ userId: 1, createdAt: -1 }) // For user timeline

// Handle model caching properly - delete cached model if schema changed
if (mongoose.models.Notification) {
    delete mongoose.models.Notification
}

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema)

export default Notification
