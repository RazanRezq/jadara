/**
 * Client-safe auth utilities
 * These functions can be safely imported in client components
 * No Mongoose/MongoDB dependencies
 */

import type { UserRole } from './auth'

// Role color styling (safe for client)
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        superadmin: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5',
        admin: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5',
        reviewer: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
    }
    return colors[role]
}

// Synchronous permission check (uses default permissions - for client components)
export function hasGranularPermission(
    userRole: UserRole,
    permission: string
): boolean {
    // Superadmin always has all permissions
    if (userRole === 'superadmin') {
        return true
    }

    // Default permission sets (fallback when database is not accessible)
    const defaultPermissions: Record<UserRole, string[]> = {
        superadmin: [], // Superadmin has all permissions (checked above)
        admin: [
            'users.view',
            'users.create',
            'users.edit',
            'users.export',
            'users.import',
            'jobs.view',
            'jobs.create',
            'jobs.edit',
            'jobs.delete',
            'jobs.publish',
            'applicants.view',
            'applicants.edit',
            'applicants.delete',
            'applicants.export',
            'evaluations.view',
            'evaluations.create',
            'evaluations.edit',
            'evaluations.delete',
            'questions.view',
            'questions.create',
            'questions.edit',
            'questions.delete',
            'company.view',
            'company.edit',
            'notifications.view',
            'notifications.manage',
        ],
        reviewer: [
            'applicants.view',
            'evaluations.view',
            'evaluations.create',
            'evaluations.edit',
            'jobs.view',
            'questions.view',
            'notifications.view',
        ],
    }

    return defaultPermissions[userRole]?.includes(permission) || false
}

// Role hierarchy for role-based permission checking
export const roleHierarchy: Record<UserRole, number> = {
    superadmin: 3,
    admin: 2,
    reviewer: 1,
}

// Role-based permission check (checks if userRole >= requiredRole in hierarchy)
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Re-export hasGranularPermission as hasPermission for backward compatibility
export const hasPermission = hasGranularPermission
