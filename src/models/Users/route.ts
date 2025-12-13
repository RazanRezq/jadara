import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import User from './userSchema'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['superadmin', 'admin', 'reviewer']).optional(),
})

const app = new Hono()

// Login
app.post('/login', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = loginSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const { email, password } = validation.data

        // Find user and include password for comparison
        const user = await User.findOne({ email, isActive: true }).select('+password')

        if (!user) {
            return c.json(
                {
                    success: false,
                    error: 'Invalid email or password',
                },
                401
            )
        }

        const isPasswordValid = await user.comparePassword(password)

        if (!isPasswordValid) {
            return c.json(
                {
                    success: false,
                    error: 'Invalid email or password',
                },
                401
            )
        }

        // Update last login
        user.lastLogin = new Date()
        await user.save()

        // Return user data (password excluded by default)
        const userData = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
        }

        return c.json({
            success: true,
            message: 'Login successful',
            user: userData,
        })
    } catch (error) {
        console.error('Login error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Register (for initial setup or admin creating users)
app.post('/register', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const validation = registerSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const { email, password, name, role } = validation.data

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return c.json(
                {
                    success: false,
                    error: 'User with this email already exists',
                },
                409
            )
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            role: role || 'reviewer',
        })

        return c.json(
            {
                success: true,
                message: 'User registered successfully',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            201
        )
    } catch (error) {
        console.error('Registration error:', error)
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Get current user profile
app.get('/me', async (c) => {
    try {
        await dbConnect()
        const userId = c.req.query('userId')

        if (!userId) {
            return c.json(
                {
                    success: false,
                    error: 'User ID is required',
                },
                400
            )
        }

        const user = await User.findById(userId)

        if (!user) {
            return c.json(
                {
                    success: false,
                    error: 'User not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Get all users (admin only)
app.get('/list', async (c) => {
    try {
        await dbConnect()
        const page = parseInt(c.req.query('page') || '1')
        const limit = parseInt(c.req.query('limit') || '10')
        const searchTerm = c.req.query('search') || ''
        const role = c.req.query('role') || ''

        const query: Record<string, unknown> = {}

        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
            ]
        }

        if (role) {
            query.role = role
        }

        const skip = (page - 1) * limit
        const total = await User.countDocuments(query)
        const users = await User.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        return c.json({
            success: true,
            users: users.map((user) => ({
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Update user
app.post('/update/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()

        const updateSchema = z.object({
            name: z.string().min(2).optional(),
            email: z.string().email().optional(),
            role: z.enum(['superadmin', 'admin', 'reviewer']).optional(),
            isActive: z.boolean().optional(),
        })

        const validation = updateSchema.safeParse(body)
        if (!validation.success) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.flatten().fieldErrors,
                },
                400
            )
        }

        const user = await User.findById(id)
        if (!user) {
            return c.json(
                {
                    success: false,
                    error: 'User not found',
                },
                404
            )
        }

        // Check if email is being changed and if it's already taken
        if (validation.data.email && validation.data.email !== user.email) {
            const existingUser = await User.findOne({ email: validation.data.email })
            if (existingUser) {
                return c.json(
                    {
                        success: false,
                        error: 'Email already in use',
                    },
                    409
                )
            }
        }

        // Update user fields
        Object.assign(user, validation.data)
        await user.save()

        return c.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Delete user
app.delete('/delete/:id', async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')

        const user = await User.findById(id)
        if (!user) {
            return c.json(
                {
                    success: false,
                    error: 'User not found',
                },
                404
            )
        }

        await User.findByIdAndDelete(id)

        return c.json({
            success: true,
            message: 'User deleted successfully',
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

export default app

