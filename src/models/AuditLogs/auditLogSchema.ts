import mongoose, { Schema, Document, Model } from 'mongoose'

export type AuditAction =
    // User actions
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'user.login'
    | 'user.logout'
    | 'user.password_reset'
    | 'user.role_changed'
    | 'user.status_changed'
    // Job actions
    | 'job.created'
    | 'job.updated'
    | 'job.deleted'
    | 'job.published'
    | 'job.closed'
    | 'job.archived'
    // Applicant actions
    | 'applicant.created'
    | 'applicant.updated'
    | 'applicant.deleted'
    | 'applicant.status_changed'
    | 'applicant.bulk_status_changed'
    | 'applicant.evaluated'
    // Evaluation actions
    | 'evaluation.created'
    | 'evaluation.updated'
    | 'evaluation.deleted'
    // System actions
    | 'system.settings_updated'
    | 'system.backup_created'
    | 'system.backup_restored'
    // Settings actions
    | 'settings.company_updated'
    | 'settings.email_updated'
    | 'settings.ai_updated'
    // Permission actions
    | 'permissions.updated'
    | 'permissions.reset'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface IAuditLog extends Document {
    // Who performed the action
    userId: mongoose.Types.ObjectId
    userEmail: string
    userName: string
    userRole: 'reviewer' | 'admin' | 'superadmin'

    // What action was performed
    action: AuditAction
    resource: string // e.g., 'User', 'Job', 'Applicant', 'System'
    resourceId?: string // ID of the affected resource
    resourceName?: string // Human-readable name (e.g., user email, job title)

    // Details
    description: string
    metadata?: Record<string, any> // Additional context
    changes?: {
        before?: Record<string, any>
        after?: Record<string, any>
    }

    // Context
    severity: AuditSeverity
    ipAddress?: string
    userAgent?: string
    requestMethod?: string
    requestUrl?: string

    // Timestamps
    timestamp: Date
    createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        // User info
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
            index: true,
        },

        // Action info
        action: {
            type: String,
            required: true,
            index: true,
        },
        resource: {
            type: String,
            required: true,
            index: true,
        },
        resourceId: {
            type: String,
            index: true,
        },
        resourceName: {
            type: String,
        },

        // Details
        description: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        changes: {
            before: Schema.Types.Mixed,
            after: Schema.Types.Mixed,
        },

        // Context
        severity: {
            type: String,
            enum: ['info', 'warning', 'error', 'critical'],
            default: 'info',
            index: true,
        },
        ipAddress: String,
        userAgent: String,
        requestMethod: String,
        requestUrl: String,

        // Timestamps
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: 'auditlogs',
    }
)

// Indexes for efficient querying
AuditLogSchema.index({ timestamp: -1 })
AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ action: 1, timestamp: -1 })
AuditLogSchema.index({ resource: 1, timestamp: -1 })
AuditLogSchema.index({ severity: 1, timestamp: -1 })

// TTL index to auto-delete old logs after 90 days (configurable)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
