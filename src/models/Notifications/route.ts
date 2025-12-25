import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import Notification from './notificationSchema'

const app = new Hono()

// GET /api/notifications - Get all notifications for current user
app.get('/', async (c) => {
    try {
        await dbConnect()

        const userId = c.req.query('userId')
        const isRead = c.req.query('isRead')
        const limit = parseInt(c.req.query('limit') || '50')

        if (!userId) {
            return c.json({ success: false, error: 'User ID is required' }, 400)
        }

        const query: any = { userId }
        if (isRead !== undefined) {
            query.isRead = isRead === 'true'
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()

        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false,
        })

        return c.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        })
    } catch (error: any) {
        console.error('Error fetching notifications:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch notifications',
                details: error.message,
            },
            500
        )
    }
})

// POST /api/notifications - Create a new notification
app.post('/', async (c) => {
    try {
        await dbConnect()

        const body = await c.req.json()

        const notification = await Notification.create(body)

        return c.json({
            success: true,
            data: notification,
        })
    } catch (error: any) {
        console.error('Error creating notification:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to create notification',
                details: error.message,
            },
            500
        )
    }
})

// PATCH /api/notifications/:id/read - Mark notification as read
app.patch('/:id/read', async (c) => {
    try {
        await dbConnect()

        const id = c.req.param('id')

        const notification = await Notification.findByIdAndUpdate(
            id,
            {
                isRead: true,
                readAt: new Date(),
            },
            { new: true }
        )

        if (!notification) {
            return c.json({ success: false, error: 'Notification not found' }, 404)
        }

        return c.json({
            success: true,
            data: notification,
        })
    } catch (error: any) {
        console.error('Error marking notification as read:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to mark notification as read',
                details: error.message,
            },
            500
        )
    }
})

// PATCH /api/notifications/read-all - Mark all notifications as read for user
app.patch('/read-all', async (c) => {
    try {
        await dbConnect()

        const userId = c.req.query('userId')

        if (!userId) {
            return c.json({ success: false, error: 'User ID is required' }, 400)
        }

        await Notification.updateMany(
            { userId, isRead: false },
            {
                isRead: true,
                readAt: new Date(),
            }
        )

        return c.json({
            success: true,
            message: 'All notifications marked as read',
        })
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to mark all notifications as read',
                details: error.message,
            },
            500
        )
    }
})

// DELETE /api/notifications/:id - Delete a notification
app.delete('/:id', async (c) => {
    try {
        await dbConnect()

        const id = c.req.param('id')

        const notification = await Notification.findByIdAndDelete(id)

        if (!notification) {
            return c.json({ success: false, error: 'Notification not found' }, 404)
        }

        return c.json({
            success: true,
            message: 'Notification deleted successfully',
        })
    } catch (error: any) {
        console.error('Error deleting notification:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to delete notification',
                details: error.message,
            },
            500
        )
    }
})

export default app
