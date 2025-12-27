import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId
    userEmail: string
    userName: string
    userRole: 'reviewer' | 'admin' | 'superadmin'

    // Session identification
    sessionToken: string // JWT token hash
    sessionId: string // Unique session identifier

    // Device & Location info
    ipAddress: string
    userAgent: string
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
    browser: string
    os: string
    city?: string
    country?: string

    // Session status
    isActive: boolean
    lastActivity: Date

    // Session lifecycle
    createdAt: Date
    expiresAt: Date
    revokedAt?: Date
    revokedBy?: {
        userId: mongoose.Types.ObjectId
        reason: string
    }

    // Methods
    revoke(revokedByUserId: string, reason: string): Promise<this>
    updateActivity(): Promise<this>
}

const SessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userEmail: {
            type: String,
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            enum: ['reviewer', 'admin', 'superadmin'],
            required: true,
        },

        sessionToken: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            required: true,
        },
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'unknown'],
            default: 'unknown',
        },
        browser: {
            type: String,
            default: 'Unknown',
        },
        os: {
            type: String,
            default: 'Unknown',
        },
        city: String,
        country: String,

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastActivity: {
            type: Date,
            default: Date.now,
            index: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
        revokedAt: Date,
        revokedBy: {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            reason: String,
        },
    },
    {
        timestamps: true,
        collection: 'sessions',
    }
)

// Indexes
SessionSchema.index({ userId: 1, isActive: 1 })
SessionSchema.index({ sessionToken: 1, isActive: 1 })
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Methods
SessionSchema.methods.revoke = function(revokedByUserId: string, reason: string) {
    this.isActive = false
    this.revokedAt = new Date()
    this.revokedBy = {
        userId: revokedByUserId,
        reason,
    }
    return this.save()
}

SessionSchema.methods.updateActivity = function() {
    this.lastActivity = new Date()
    return this.save()
}

const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

export default Session
