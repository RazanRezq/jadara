import { Hono } from 'hono'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import User from './userSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction, trackChanges } from '@/lib/auditLogger'

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

        // Check if password exists
        if (!user.password) {
            console.error(`[Login] User ${email} has no password set`)
            return c.json(
                {
                    success: false,
                    error: 'User account error. Please contact administrator.',
                },
                500
            )
        }

        const isPasswordValid = await user.comparePassword(password)

        if (!isPasswordValid) {
            console.error(`[Login] Invalid password attempt for ${email}`)
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

        // Log user creation
        await logUserAction(
            {
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'user.created',
            'User',
            user._id.toString(),
            `Registered new user: ${user.email}`,
            {
                resourceName: user.name,
                metadata: {
                    email: user.email,
                    role: user.role,
                },
                severity: 'info',
            }
        )

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
app.post('/update/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const currentUser = getAuthUser(c)

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

        // Track changes before updating
        const beforeData = {
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }

        // Update user fields
        Object.assign(user, validation.data)
        await user.save()

        const afterData = {
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }

        const changes = trackChanges(beforeData, afterData)

        // Log user update with special attention to role changes
        const changedFields = Object.keys(changes.after)
        const severity = changedFields.includes('role') || changedFields.includes('isActive') ? 'warning' : 'info'
        const action = changedFields.includes('role') ? 'user.role_changed' : 'user.updated'

        await logUserAction(
            currentUser,
            action,
            'User',
            user._id.toString(),
            `Updated user: ${user.email}${changedFields.includes('role') ? ` (role changed to ${user.role})` : ''}`,
            {
                resourceName: user.name,
                changes,
                metadata: {
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    changedFields,
                },
                severity,
            }
        )

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

// Reset password (for admin use or when passwords are unknown)
app.post('/reset-password/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const body = await c.req.json()
        const currentUser = getAuthUser(c)

        const resetPasswordSchema = z.object({
            newPassword: z.string().min(6, 'Password must be at least 6 characters'),
        })

        const validation = resetPasswordSchema.safeParse(body)
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

        const user = await User.findById(id).select('+password')
        if (!user) {
            return c.json(
                {
                    success: false,
                    error: 'User not found',
                },
                404
            )
        }

        // Set new password (will be hashed by pre-save hook)
        user.password = validation.data.newPassword
        await user.save()

        // Log password reset
        await logUserAction(
            currentUser,
            'user.password_reset',
            'User',
            user._id.toString(),
            `Reset password for user: ${user.email}`,
            {
                resourceName: user.name,
                metadata: {
                    email: user.email,
                    role: user.role,
                },
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            message: 'Password reset successfully',
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
app.delete('/delete/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()
        const id = c.req.param('id')
        const currentUser = getAuthUser(c)

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

        const userName = user.name
        const userEmail = user.email
        const userRole = user.role

        await User.findByIdAndDelete(id)

        // Log user deletion
        await logUserAction(
            currentUser,
            'user.deleted',
            'User',
            id,
            `Deleted user: ${userEmail}`,
            {
                resourceName: userName,
                metadata: {
                    email: userEmail,
                    role: userRole,
                },
                severity: 'critical',
            }
        )

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

// Export users to CSV
app.get('/export', async (c) => {
    try {
        await dbConnect()

        const role = c.req.query('role') || ''
        const query: Record<string, unknown> = {}

        if (role) {
            query.role = role
        }

        const users = await User.find(query).sort({ createdAt: -1 })

        // Generate CSV
        const csvHeader = 'Name,Email,Role,Active,Last Login,Created At\n'
        const csvRows = users.map(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toISOString() : 'Never'
            const createdAt = new Date(user.createdAt).toISOString()
            return `"${user.name}","${user.email}","${user.role}","${user.isActive}","${lastLogin}","${createdAt}"`
        }).join('\n')

        const csv = csvHeader + csvRows

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users-export-${Date.now()}.csv"`,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Failed to export users',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Bulk import users from CSV
app.post('/bulk-import', async (c) => {
    try {
        await dbConnect()
        const body = await c.req.json()

        const { users: usersData, dryRun = false } = body

        if (!Array.isArray(usersData) || usersData.length === 0) {
            return c.json(
                {
                    success: false,
                    error: 'Invalid data: users array is required',
                },
                400
            )
        }

        const results = {
            total: usersData.length,
            successful: 0,
            failed: 0,
            errors: [] as any[],
            created: [] as any[],
        }

        for (let i = 0; i < usersData.length; i++) {
            const userData = usersData[i]

            try {
                // Validate user data
                const userSchema = z.object({
                    name: z.string().min(2, 'Name must be at least 2 characters'),
                    email: z.string().email('Invalid email address'),
                    password: z.string().min(6, 'Password must be at least 6 characters'),
                    role: z.enum(['superadmin', 'admin', 'reviewer']).default('reviewer'),
                    isActive: z.boolean().default(true),
                })

                const validation = userSchema.safeParse(userData)

                if (!validation.success) {
                    results.failed++
                    results.errors.push({
                        row: i + 1,
                        email: userData.email || 'N/A',
                        error: 'Validation failed',
                        details: validation.error.flatten().fieldErrors,
                    })
                    continue
                }

                // Check if user already exists
                const existingUser = await User.findOne({ email: validation.data.email })
                if (existingUser) {
                    results.failed++
                    results.errors.push({
                        row: i + 1,
                        email: validation.data.email,
                        error: 'Email already exists',
                    })
                    continue
                }

                // If dry run, don't actually create the user
                if (dryRun) {
                    results.successful++
                    results.created.push({
                        row: i + 1,
                        email: validation.data.email,
                        name: validation.data.name,
                        status: 'Would be created',
                    })
                    continue
                }

                // Create user
                const newUser = await User.create(validation.data)

                // Log bulk user creation
                await logUserAction(
                    {
                        userId: newUser._id.toString(),
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                    },
                    'user.created',
                    'User',
                    newUser._id.toString(),
                    `Bulk imported user: ${newUser.email}`,
                    {
                        resourceName: newUser.name,
                        metadata: {
                            email: newUser.email,
                            role: newUser.role,
                            importBatch: true,
                        },
                        severity: 'info',
                    }
                )

                results.successful++
                results.created.push({
                    row: i + 1,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                })
            } catch (error) {
                results.failed++
                results.errors.push({
                    row: i + 1,
                    email: userData.email || 'N/A',
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        return c.json({
            success: true,
            dryRun,
            message: dryRun
                ? `Dry run complete: ${results.successful} users would be created, ${results.failed} would fail`
                : `Import complete: ${results.successful} users created, ${results.failed} failed`,
            results,
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Bulk import failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Download CSV template
app.get('/import-template', async (c) => {
    const template = `Name,Email,Password,Role,Active
John Doe,john@example.com,password123,reviewer,true
Jane Smith,jane@example.com,password123,admin,true
Admin User,admin@example.com,admin123,admin,true`

    return new Response(template, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="users-import-template.csv"',
        },
    })
})

export default app

