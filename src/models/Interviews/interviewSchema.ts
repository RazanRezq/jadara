import mongoose, { Document, Model, Schema } from 'mongoose'

export type InterviewStatus =
    | 'scheduled'      // Interview is scheduled
    | 'confirmed'      // Candidate confirmed attendance
    | 'completed'      // Interview was held
    | 'cancelled'      // Interview was cancelled
    | 'no_show'        // Candidate didn't show up
    | 'rescheduled'    // Interview was rescheduled

export interface IInterview extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    scheduledBy: mongoose.Types.ObjectId  // Admin who scheduled
    // Interview Details
    scheduledDate: Date
    scheduledTime: string  // e.g., "14:00"
    duration: number       // in minutes
    meetingLink: string
    notes?: string         // Notes for candidate
    internalNotes?: string // Internal notes (not shared with candidate)
    // Status tracking
    status: InterviewStatus
    // Metadata
    createdAt: Date
    updatedAt: Date
}

const interviewSchema = new Schema<IInterview>(
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
        scheduledBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Scheduled by user ID is required'],
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Scheduled date is required'],
        },
        scheduledTime: {
            type: String,
            required: [true, 'Scheduled time is required'],
        },
        duration: {
            type: Number,
            default: 60,
            min: 15,
            max: 240,
        },
        meetingLink: {
            type: String,
            required: [true, 'Meeting link is required'],
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        internalNotes: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'],
            default: 'scheduled',
        },
    },
    {
        timestamps: true,
    }
)

// Indexes for common queries
interviewSchema.index({ scheduledDate: 1, status: 1 })
interviewSchema.index({ applicantId: 1, status: 1 })
interviewSchema.index({ scheduledBy: 1, scheduledDate: 1 })

const Interview: Model<IInterview> =
    mongoose.models.Interview || mongoose.model<IInterview>('Interview', interviewSchema)

export default Interview
