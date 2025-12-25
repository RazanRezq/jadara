import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import PermissionSet, { type Permission } from './permissionsSchema'
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'
import { logUserAction } from '@/lib/auditLogger'

const app = new Hono()

// Permission categories for UI organization
const permissionCategories = {
    en: {
        users: 'User Management',
        jobs: 'Job Management',
        applicants: 'Applicant Management',
        evaluations: 'Evaluation Management',
        questions: 'Question Bank',
        company: 'Company Settings',
        system: 'System Settings',
        audit: 'Audit Logs',
        notifications: 'Notifications',
    },
    ar: {
        users: 'إدارة المستخدمين',
        jobs: 'إدارة الوظائف',
        applicants: 'إدارة المتقدمين',
        evaluations: 'إدارة التقييمات',
        questions: 'بنك الأسئلة',
        company: 'إعدادات الشركة',
        system: 'إعدادات النظام',
        audit: 'سجلات المراجعة',
        notifications: 'الإشعارات',
    },
}

const permissionDescriptions: Record<
    Permission,
    { en: string; ar: string; category: string }
> = {
    // User Management
    'users.view': {
        en: 'View users list',
        ar: 'عرض قائمة المستخدمين',
        category: 'users',
    },
    'users.create': {
        en: 'Create new users',
        ar: 'إنشاء مستخدمين جدد',
        category: 'users',
    },
    'users.edit': {
        en: 'Edit user details',
        ar: 'تعديل بيانات المستخدمين',
        category: 'users',
    },
    'users.delete': {
        en: 'Delete users',
        ar: 'حذف المستخدمين',
        category: 'users',
    },
    'users.export': {
        en: 'Export users to CSV',
        ar: 'تصدير المستخدمين إلى CSV',
        category: 'users',
    },
    'users.import': {
        en: 'Import users from CSV',
        ar: 'استيراد المستخدمين من CSV',
        category: 'users',
    },
    // Job Management
    'jobs.view': {
        en: 'View jobs list',
        ar: 'عرض قائمة الوظائف',
        category: 'jobs',
    },
    'jobs.create': {
        en: 'Create new jobs',
        ar: 'إنشاء وظائف جديدة',
        category: 'jobs',
    },
    'jobs.edit': {
        en: 'Edit job details',
        ar: 'تعديل تفاصيل الوظائف',
        category: 'jobs',
    },
    'jobs.delete': {
        en: 'Delete jobs',
        ar: 'حذف الوظائف',
        category: 'jobs',
    },
    'jobs.publish': {
        en: 'Publish/unpublish jobs',
        ar: 'نشر/إلغاء نشر الوظائف',
        category: 'jobs',
    },
    // Applicant Management
    'applicants.view': {
        en: 'View applicants',
        ar: 'عرض المتقدمين',
        category: 'applicants',
    },
    'applicants.edit': {
        en: 'Edit applicant details',
        ar: 'تعديل بيانات المتقدمين',
        category: 'applicants',
    },
    'applicants.delete': {
        en: 'Delete applicants',
        ar: 'حذف المتقدمين',
        category: 'applicants',
    },
    'applicants.export': {
        en: 'Export applicants data',
        ar: 'تصدير بيانات المتقدمين',
        category: 'applicants',
    },
    // Evaluations
    'evaluations.view': {
        en: 'View evaluations',
        ar: 'عرض التقييمات',
        category: 'evaluations',
    },
    'evaluations.create': {
        en: 'Create evaluations',
        ar: 'إنشاء التقييمات',
        category: 'evaluations',
    },
    'evaluations.edit': {
        en: 'Edit evaluations',
        ar: 'تعديل التقييمات',
        category: 'evaluations',
    },
    'evaluations.delete': {
        en: 'Delete evaluations',
        ar: 'حذف التقييمات',
        category: 'evaluations',
    },
    // Questions
    'questions.view': {
        en: 'View question bank',
        ar: 'عرض بنك الأسئلة',
        category: 'questions',
    },
    'questions.create': {
        en: 'Create questions',
        ar: 'إنشاء الأسئلة',
        category: 'questions',
    },
    'questions.edit': {
        en: 'Edit questions',
        ar: 'تعديل الأسئلة',
        category: 'questions',
    },
    'questions.delete': {
        en: 'Delete questions',
        ar: 'حذف الأسئلة',
        category: 'questions',
    },
    // Company
    'company.view': {
        en: 'View company settings',
        ar: 'عرض إعدادات الشركة',
        category: 'company',
    },
    'company.edit': {
        en: 'Edit company settings',
        ar: 'تعديل إعدادات الشركة',
        category: 'company',
    },
    // System
    'system.view': {
        en: 'View system settings',
        ar: 'عرض إعدادات النظام',
        category: 'system',
    },
    'system.edit': {
        en: 'Edit system settings',
        ar: 'تعديل إعدادات النظام',
        category: 'system',
    },
    'system.logs': {
        en: 'View system logs',
        ar: 'عرض سجلات النظام',
        category: 'system',
    },
    'system.sessions': {
        en: 'Manage user sessions',
        ar: 'إدارة جلسات المستخدمين',
        category: 'system',
    },
    // Audit
    'audit.view': {
        en: 'View audit logs',
        ar: 'عرض سجلات المراجعة',
        category: 'audit',
    },
    'audit.export': {
        en: 'Export audit logs',
        ar: 'تصدير سجلات المراجعة',
        category: 'audit',
    },
    // Notifications
    'notifications.view': {
        en: 'View notifications',
        ar: 'عرض الإشعارات',
        category: 'notifications',
    },
    'notifications.manage': {
        en: 'Manage notification settings',
        ar: 'إدارة إعدادات الإشعارات',
        category: 'notifications',
    },
}

/**
 * GET /api/permissions
 * Get all permission sets
 */
app.get('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        // Initialize defaults if not exists
        await PermissionSet.initializeDefaults()

        const permissionSets = await PermissionSet.find({})
            .sort({ role: 1 })
            .lean()

        return c.json({
            success: true,
            data: permissionSets,
        })
    } catch (error: any) {
        console.error('Error fetching permission sets:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch permission sets',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/permissions/metadata
 * Get permission metadata (categories, descriptions)
 */
app.get('/metadata', authenticate, requireRole('superadmin'), async (c) => {
    try {
        return c.json({
            success: true,
            data: {
                categories: permissionCategories,
                permissions: permissionDescriptions,
            },
        })
    } catch (error: any) {
        console.error('Error fetching permission metadata:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch permission metadata',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/permissions/:role
 * Get permissions for a specific role
 */
app.get('/:role', authenticate, async (c) => {
    try {
        await dbConnect()

        const role = c.req.param('role')

        const permissionSet = await PermissionSet.findOne({
            role,
            isActive: true,
        }).lean()

        if (!permissionSet) {
            return c.json(
                {
                    success: false,
                    error: 'Permission set not found',
                },
                404
            )
        }

        return c.json({
            success: true,
            data: permissionSet,
        })
    } catch (error: any) {
        console.error('Error fetching permission set:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch permission set',
                details: error.message,
            },
            500
        )
    }
})

/**
 * PATCH /api/permissions/:role
 * Update permissions for a role (Superadmin only)
 */
app.patch('/:role', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const role = c.req.param('role')
        const body = await c.req.json()

        const { permissions, displayName, description } = body

        const permissionSet = await PermissionSet.findOne({ role })

        if (!permissionSet) {
            return c.json(
                {
                    success: false,
                    error: 'Permission set not found',
                },
                404
            )
        }

        // Superadmin permissions cannot be reduced
        if (role === 'superadmin') {
            return c.json(
                {
                    success: false,
                    error: 'Superadmin permissions cannot be modified',
                },
                403
            )
        }

        // Store old values for audit
        const oldPermissions = [...permissionSet.permissions]

        // Update fields
        if (permissions) permissionSet.permissions = permissions
        if (displayName) {
            if (displayName.en) permissionSet.displayName.en = displayName.en
            if (displayName.ar) permissionSet.displayName.ar = displayName.ar
        }
        if (description) {
            if (description.en) permissionSet.description.en = description.en
            if (description.ar) permissionSet.description.ar = description.ar
        }

        permissionSet.isCustom = true
        permissionSet.updatedBy = user.userId as any

        await permissionSet.save()

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'permissions.updated',
            'PermissionSet',
            permissionSet._id.toString(),
            `Updated permissions for role: ${role}`,
            {
                resourceName: role,
                changes: {
                    before: { permissions: oldPermissions },
                    after: { permissions: permissionSet.permissions },
                },
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            message: 'Permissions updated successfully',
            data: permissionSet,
        })
    } catch (error: any) {
        console.error('Error updating permissions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to update permissions',
                details: error.message,
            },
            500
        )
    }
})

/**
 * POST /api/permissions/:role/reset
 * Reset role permissions to defaults (Superadmin only)
 */
app.post('/:role/reset', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const user = getAuthUser(c)
        const role = c.req.param('role')

        if (role === 'superadmin') {
            return c.json(
                {
                    success: false,
                    error: 'Superadmin permissions cannot be reset',
                },
                403
            )
        }

        // Delete current permission set
        await PermissionSet.deleteOne({ role })

        // Reinitialize defaults
        await PermissionSet.initializeDefaults()

        const newPermissionSet = await PermissionSet.findOne({ role })

        // Log the action
        await logUserAction(
            {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'permissions.reset',
            'PermissionSet',
            newPermissionSet?._id.toString() || role,
            `Reset permissions for role: ${role} to defaults`,
            {
                resourceName: role,
                severity: 'warning',
            }
        )

        return c.json({
            success: true,
            message: 'Permissions reset to defaults successfully',
            data: newPermissionSet,
        })
    } catch (error: any) {
        console.error('Error resetting permissions:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to reset permissions',
                details: error.message,
            },
            500
        )
    }
})

export default app
