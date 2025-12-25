/**
 * Client-safe auth utilities
 * These functions can be safely imported in client components
 * No Mongoose/MongoDB dependencies
 */

import type { UserRole } from './auth'

// Role color styling (safe for client)
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        superadmin: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
        admin: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
        reviewer: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
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
        superadmin: [],
        admin: [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.export', 'users.import',
            'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.publish',
            'applicants.view', 'applicants.edit', 'applicants.delete', 'applicants.export',
            'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.delete',
            'questions.view', 'questions.create', 'questions.edit', 'questions.delete',
            'company.view', 'company.edit',
        ],
        reviewer: [
            'applicants.view', 'evaluations.view', 'evaluations.create', 'evaluations.edit', 'jobs.view',
        ],
    }

    return defaultPermissions[userRole]?.includes(permission) || false
}

// Re-export hasPermission for backward compatibility
export const hasPermission = hasGranularPermission
