import { Hono } from 'hono'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Notification from './notificationSchema'

const app = new Hono()

// GET /api/notifications - Get all notifications for current user (with pagination, filtering, search)
app.get('/', async (c) => {
    try {
        await dbConnect()

        const userId = c.req.query('userId')
        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '10')
        const status = c.req.query('status')
        const type = c.req.query('type')
        const priority = c.req.query('priority')
        const search = c.req.query('search')

        if (!userId) {
            return c.json({ success: false, error: 'User ID is required' }, 400)
        }

        // Build query
        const query: any = { userId: new mongoose.Types.ObjectId(userId as string) }

        // Status filter
        if (status === 'read') {
            query.isRead = true
        } else if (status === 'unread') {
            query.isRead = false
        }

        // Type filter
        if (type && type !== 'all') {
            query.type = type
        }

        // Priority filter
        if (priority && priority !== 'all') {
            query.priority = priority
        }

        // Search filter (title or message)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ]
        }

        const skip = (page - 1) * limit

        // Execute queries in parallel
        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId: query.userId, isRead: false }),
        ])

        return c.json({
            success: true,
            data: {
                notifications,
                total,
                unreadCount,
                page,
                totalPages: Math.ceil(total / limit),
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

// DELETE /api/notifications/delete-read - Bulk delete all read notifications for user
app.delete('/delete-read', async (c) => {
    try {
        await dbConnect()

        const userId = c.req.query('userId')

        if (!userId) {
            return c.json({ success: false, error: 'User ID is required' }, 400)
        }

        const result = await Notification.deleteMany({
            userId: new mongoose.Types.ObjectId(userId as string),
            isRead: true,
        })

        return c.json({
            success: true,
            data: { deletedCount: result.deletedCount },
            message: `${result.deletedCount} read notifications deleted successfully`,
        })
    } catch (error: any) {
        console.error('Error deleting read notifications:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to delete read notifications',
                details: error.message,
            },
            500
        )
    }
})

export default app
