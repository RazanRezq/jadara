import AuditLog, { type IAuditLog, type AuditAction, type AuditSeverity } from '@/models/AuditLogs/auditLogSchema'
import dbConnect from './mongodb'

interface AuditLogOptions {
    userId: string
    userEmail: string
    userName: string
    userRole: 'reviewer' | 'admin' | 'superadmin'
    action: AuditAction
    resource: string
    resourceId?: string
    resourceName?: string
    description: string
    metadata?: Record<string, any>
    changes?: {
        before?: Record<string, any>
        after?: Record<string, any>
    }
    severity?: AuditSeverity
    ipAddress?: string
    userAgent?: string
    requestMethod?: string
    requestUrl?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(options: AuditLogOptions): Promise<void> {
    try {
        await dbConnect()

        const auditLog = new AuditLog({
            userId: options.userId,
            userEmail: options.userEmail,
            userName: options.userName,
            userRole: options.userRole,
            action: options.action,
            resource: options.resource,
            resourceId: options.resourceId,
            resourceName: options.resourceName,
            description: options.description,
            metadata: options.metadata,
            changes: options.changes,
            severity: options.severity || 'info',
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            requestMethod: options.requestMethod,
            requestUrl: options.requestUrl,
            timestamp: new Date(),
        })

        await auditLog.save()
    } catch (error) {
        // Don't throw errors in audit logging - just log to console
        // This prevents audit logging from breaking the main application flow
        console.error('Failed to create audit log:', error)
    }
}

/**
 * Helper function to log user actions
 */
export async function logUserAction(
    user: { userId: string; email: string; name: string; role: 'reviewer' | 'admin' | 'superadmin' },
    action: AuditAction,
    resource: string,
    resourceId: string,
    description: string,
    options?: {
        resourceName?: string
        metadata?: Record<string, any>
        changes?: { before?: Record<string, any>; after?: Record<string, any> }
        severity?: AuditSeverity
        ipAddress?: string
        userAgent?: string
    }
): Promise<void> {
    await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        action,
        resource,
        resourceId,
        resourceName: options?.resourceName,
        description,
        metadata: options?.metadata,
        changes: options?.changes,
        severity: options?.severity,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
    })
}

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeForAudit(data: any): any {
    const sanitized = { ...data }
    const sensitiveFields = ['password', 'passwordHash', 'token', 'apiKey', 'secret', 'JWT_SECRET']

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]'
        }
    }

    return sanitized
}

/**
 * Track changes between old and new objects
 */
export function trackChanges(before: Record<string, any>, after: Record<string, any>): {
    before: Record<string, any>
    after: Record<string, any>
} {
    const changes: { before: Record<string, any>; after: Record<string, any> } = {
        before: {},
        after: {},
    }

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
        if (before[key] !== after[key]) {
            changes.before[key] = before[key]
            changes.after[key] = after[key]
        }
    }

    // Sanitize sensitive fields
    changes.before = sanitizeForAudit(changes.before)
    changes.after = sanitizeForAudit(changes.after)

    return changes
}
