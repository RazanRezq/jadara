import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import AuditLog from './auditLogSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'

const app = new Hono()

/**
 * GET /api/audit-logs
 * Fetch audit logs with pagination and filters (Superadmin only)
 */
app.get('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '50')
        const skip = (page - 1) * limit

        // Filters
        const userId = c.req.query('userId')
        const action = c.req.query('action')
        const resource = c.req.query('resource')
        const severity = c.req.query('severity')
        const userRole = c.req.query('userRole')
        const startDate = c.req.query('startDate')
        const endDate = c.req.query('endDate')
        const search = c.req.query('search') // Search in description or resourceName

        // Build filter query
        const filter: any = {}

        if (userId) filter.userId = userId
        if (action) filter.action = action
        if (resource) filter.resource = resource
        if (severity) filter.severity = severity
        if (userRole) filter.userRole = userRole

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {}
            if (startDate) filter.timestamp.$gte = new Date(startDate)
            if (endDate) filter.timestamp.$lte = new Date(endDate)
        }

        // Search filter
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { resourceName: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
            ]
        }

        // Fetch logs
        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await AuditLog.countDocuments(filter)

        return c.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page * limit < total,
                },
            },
        })
    } catch (error: any) {
        console.error('Error fetching audit logs:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch audit logs',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/audit-logs/:id
 * Get single audit log by ID (Superadmin only)
 */
app.get('/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const id = c.req.param('id')
        const log = await AuditLog.findById(id).lean()

        if (!log) {
            return c.json(
                {
                    success: false,
                    error: 'Audit log not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            data: log,
        })
    } catch (error: any) {
        console.error('Error fetching audit log:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch audit log',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics (Superadmin only)
 */
app.get('/stats/overview', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const startDate = c.req.query('startDate')
        const endDate = c.req.query('endDate')

        const filter: any = {}
        if (startDate || endDate) {
            filter.timestamp = {}
            if (startDate) filter.timestamp.$gte = new Date(startDate)
            if (endDate) filter.timestamp.$lte = new Date(endDate)
        }

        // Get counts by action type
        const byAction = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ])

        // Get counts by resource
        const byResource = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$resource', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ])

        // Get counts by user
        const byUser = await AuditLog.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    email: { $first: '$userEmail' },
                    name: { $first: '$userName' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ])

        // Get counts by severity
        const bySeverity = await AuditLog.aggregate([
            { $match: filter },
            { $group: { _id: '$severity', count: { $sum: 1 } } },
        ])

        // Activity timeline (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const timeline = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])

        // Total count
        const total = await AuditLog.countDocuments(filter)

        return c.json({
            success: true,
            data: {
                total,
                byAction,
                byResource,
                byUser,
                bySeverity,
                timeline,
            },
        })
    } catch (error: any) {
        console.error('Error fetching audit log stats:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch audit log statistics',
                details: error.message,
            },
            500
        )
    }
})

/**
 * DELETE /api/audit-logs/cleanup
 * Delete old audit logs (Superadmin only)
 */
app.delete('/cleanup', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const daysOld = parseInt(c.req.query('days') || '90')
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)

        const result = await AuditLog.deleteMany({
            timestamp: { $lt: cutoffDate },
        })

        return c.json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                cutoffDate,
            },
            message: `Deleted ${result.deletedCount} audit logs older than ${daysOld} days`,
        })
    } catch (error: any) {
        console.error('Error cleaning up audit logs:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to cleanup audit logs',
                details: error.message,
            },
            500
        )
    }
})

export default app
