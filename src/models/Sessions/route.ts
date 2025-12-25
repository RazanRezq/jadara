import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import Session from './sessionSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'

const app = new Hono()

/**
 * GET /api/sessions
 * Get all active sessions (Superadmin only)
 */
app.get('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '50')
        const skip = (page - 1) * limit

        const userId = c.req.query('userId')
        const isActive = c.req.query('isActive')

        const filter: any = {}
        if (userId) filter.userId = userId
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const sessions = await Session.find(filter)
            .sort({ lastActivity: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email role')
            .lean()

        const total = await Session.countDocuments(filter)

        return c.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        })
    } catch (error: any) {
        console.error('Error fetching sessions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch sessions',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/sessions/my-sessions
 * Get current user's active sessions
 */
app.get('/my-sessions', authenticate, async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)

        const sessions = await Session.find({
            userId: user.userId,
            isActive: true,
        })
            .sort({ lastActivity: -1 })
            .lean()

        return c.json({
            success: true,
            data: sessions,
        })
    } catch (error: any) {
        console.error('Error fetching user sessions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch your sessions',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/sessions/stats
 * Get session statistics (Superadmin only)
 */
app.get('/stats', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const now = new Date()

        // Active sessions count
        const activeSessions = await Session.countDocuments({ isActive: true })

        // Sessions by role
        const byRole = await Session.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$userRole', count: { $sum: 1 } } },
        ])

        // Sessions by device type
        const byDevice = await Session.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        ])

        // Top users by session count
        const topUsers = await Session.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    userName: { $first: '$userName' },
                    userEmail: { $first: '$userEmail' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ])

        // Sessions created in last 24 hours
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const recentSessions = await Session.countDocuments({
            createdAt: { $gte: last24Hours },
        })

        return c.json({
            success: true,
            data: {
                activeSessions,
                byRole,
                byDevice,
                topUsers,
                recentSessions,
            },
        })
    } catch (error: any) {
        console.error('Error fetching session stats:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch session statistics',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/sessions/revoke/:sessionId
 * Revoke a specific session (Superadmin only)
 */
app.post('/revoke/:sessionId', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const sessionId = c.req.param('sessionId')
        const { reason } = await c.req.json()

        const session = await Session.findOne({ sessionId, isActive: true })

        if (!session) {
            return c.json(
                {
                    success: false,
                    error: 'Session not found or already revoked',
                },
                404
            )
        }

        await session.revoke(user.userId, reason || 'Revoked by superadmin')

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'user.logout',
            'Session',
            sessionId,
            `Revoked session for ${session.userName}`,
            {
                resourceName: session.userEmail,
                metadata: {
                    targetUserId: session.userId.toString(),
                    reason: reason || 'Revoked by superadmin',
                },
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            message: 'Session revoked successfully',
        })
    } catch (error: any) {
        console.error('Error revoking session:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to revoke session',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/sessions/revoke-all/:userId
 * Revoke all sessions for a specific user (Superadmin only)
 */
app.post('/revoke-all/:userId', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const userId = c.req.param('userId')
        const { reason } = await c.req.json()

        const sessions = await Session.find({ userId, isActive: true })

        if (sessions.length === 0) {
            return c.json({
                success: true,
                message: 'No active sessions found for this user',
                count: 0,
            })
        }

        // Revoke all sessions
        for (const session of sessions) {
            await session.revoke(user.userId, reason || 'All sessions revoked by superadmin')
        }

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'user.logout',
            'User',
            userId,
            `Revoked all ${sessions.length} sessions for user`,
            {
                resourceName: sessions[0].userEmail,
                metadata: {
                    targetUserId: userId,
                    sessionCount: sessions.length,
                    reason: reason || 'All sessions revoked by superadmin',
                },
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            message: `${sessions.length} sessions revoked successfully`,
            count: sessions.length,
        })
    } catch (error: any) {
        console.error('Error revoking all sessions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to revoke sessions',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/sessions/revoke-my-session/:sessionId
 * Revoke own session (logout from specific device)
 */
app.post('/revoke-my-session/:sessionId', authenticate, async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const sessionId = c.req.param('sessionId')

        const session = await Session.findOne({
            sessionId,
            userId: user.userId,
            isActive: true,
        })

        if (!session) {
            return c.json(
                {
                    success: false,
                    error: 'Session not found or already revoked',
                },
                404
            )
        }

        await session.revoke(user.userId, 'User logged out from device')

        return c.json({
            success: true,
            message: 'Session revoked successfully',
        })
    } catch (error: any) {
        console.error('Error revoking own session:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to revoke session',
                details: error.message,
            },
            500
        )
    }
})

/**
 * DELETE /api/sessions/cleanup
 * Delete expired and revoked sessions (Superadmin only)
 */
app.delete('/cleanup', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const now = new Date()

        const result = await Session.deleteMany({
            $or: [
                { expiresAt: { $lt: now } },
                { isActive: false, revokedAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }, // Revoked > 30 days ago
            ],
        })

        return c.json({
            success: true,
            message: `Cleaned up ${result.deletedCount} sessions`,
            deletedCount: result.deletedCount,
        })
    } catch (error: any) {
        console.error('Error cleaning up sessions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to cleanup sessions',
                details: error.message,
            },
            500
        )
    }
})

export default app
