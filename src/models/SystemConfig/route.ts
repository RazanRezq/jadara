import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import SystemConfig from './systemConfigSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'

const app = new Hono()

/**
 * GET /api/system-config
 * Get system configuration (Superadmin only)
 */
app.get('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        let config = await SystemConfig.findOne().lean()

        // If no config exists, create default
        if (!config) {
            config = await SystemConfig.create({})
        }

        // Remove sensitive fields for security
        const sanitizedConfig = { ...config }
        if (sanitizedConfig.email?.apiKey) sanitizedConfig.email.apiKey = '••••••••'
        if (sanitizedConfig.ai?.apiKey) sanitizedConfig.ai.apiKey = '••••••••'
        if (sanitizedConfig.storage?.accessKeyId) sanitizedConfig.storage.accessKeyId = '••••••••'
        if (sanitizedConfig.storage?.secretAccessKey) sanitizedConfig.storage.secretAccessKey = '••••••••'
        if (sanitizedConfig.email?.smtpPassword) sanitizedConfig.email.smtpPassword = '••••••••'

        return c.json({
            success: true,
            data: sanitizedConfig,
        })
    } catch (error: any) {
        console.error('Error fetching system config:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch system configuration',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/system-config
 * Update system configuration (Superadmin only)
 */
app.post('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const updates = await c.req.json()

        // Get existing config
        let config = await SystemConfig.findOne()

        // If no config exists, create one
        if (!config) {
            config = new SystemConfig(updates)
        } else {
            // Update existing config
            Object.assign(config, updates)
        }

        // Set last updated by
        config.lastUpdatedBy = {
            userId: user.userId as any,
            email: user.email,
            name: user.name,
        }

        await config.save()

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'system.settings_updated',
            'System',
            config._id.toString(),
            'Updated system configuration',
            {
                resourceName: 'System Settings',
                metadata: {
                    updatedFields: Object.keys(updates),
                },
                severity: 'info',
            }
        )

        // Sanitize sensitive data before returning
        const sanitizedConfig = config.toObject()
        if (sanitizedConfig.email?.apiKey) sanitizedConfig.email.apiKey = '••••••••'
        if (sanitizedConfig.ai?.apiKey) sanitizedConfig.ai.apiKey = '••••••••'
        if (sanitizedConfig.storage?.accessKeyId) sanitizedConfig.storage.accessKeyId = '••••••••'
        if (sanitizedConfig.storage?.secretAccessKey) sanitizedConfig.storage.secretAccessKey = '••••••••'
        if (sanitizedConfig.email?.smtpPassword) sanitizedConfig.email.smtpPassword = '••••••••'

        return c.json({
            success: true,
            data: sanitizedConfig,
            message: 'System configuration updated successfully',
        })
    } catch (error: any) {
        console.error('Error updating system config:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to update system configuration',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/system-config/test-email
 * Test email configuration (Superadmin only)
 */
app.post('/test-email', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const { testEmail } = await c.req.json()

        if (!testEmail) {
            return c.json(
                {
                    success: false,
                    error: 'Test email address is required',
                },
                400
            )
        }

        const config = await SystemConfig.findOne()

        if (!config || !config.email.enabled) {
            return c.json(
                {
                    success: false,
                    error: 'Email is not configured or enabled',
                },
                400
            )
        }

        // TODO: Implement actual email sending logic based on provider
        // For now, return a mock success

        return c.json({
            success: true,
            message: `Test email would be sent to ${testEmail}`,
            provider: config.email.provider,
        })
    } catch (error: any) {
        console.error('Error testing email:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to test email configuration',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/system-config/test-ai
 * Test AI configuration (Superadmin only)
 */
app.post('/test-ai', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const config = await SystemConfig.findOne()

        if (!config || !config.ai.enabled) {
            return c.json(
                {
                    success: false,
                    error: 'AI is not configured or enabled',
                },
                400
            )
        }

        // TODO: Implement actual AI API test
        // For now, return a mock success

        return c.json({
            success: true,
            message: 'AI configuration is valid',
            provider: config.ai.provider,
            model: config.ai.model,
        })
    } catch (error: any) {
        console.error('Error testing AI:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to test AI configuration',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/system-config/reset
 * Reset to default configuration (Superadmin only)
 */
app.post('/reset', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)

        // Delete existing config
        await SystemConfig.deleteMany({})

        // Create new default config
        const defaultConfig = await SystemConfig.create({
            lastUpdatedBy: {
                userId: user.userId,
                email: user.email,
                name: user.name,
            },
        })

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'system.settings_updated',
            'System',
            defaultConfig._id.toString(),
            'Reset system configuration to defaults',
            {
                resourceName: 'System Settings',
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            data: defaultConfig,
            message: 'System configuration reset to defaults',
        })
    } catch (error: any) {
        console.error('Error resetting system config:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to reset system configuration',
                details: error.message,
            },
            500
        )
    }
})

export default app
