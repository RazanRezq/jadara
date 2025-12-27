import { SignJWT, jwtVerify } from 'jose'

export type UserRole = 'superadmin' | 'admin' | 'reviewer'

export interface SessionPayload {
    userId: string
    email: string
    name: string
    role: UserRole
    expiresAt?: Date
}

const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const encodedKey = new TextEncoder().encode(secretKey)

export async function createToken(payload: Omit<SessionPayload, 'expiresAt'>): Promise<string> {
    const session = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)

    return session
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as unknown as SessionPayload
    } catch {
        return null
    }
}

// Role hierarchy for permissions
export const roleHierarchy: Record<UserRole, number> = {
    superadmin: 3,
    admin: 2,
    reviewer: 1,
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        superadmin: 'Super Admin',
        admin: 'Admin',
        reviewer: 'Reviewer',
    }
    return labels[role]
}

export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        superadmin: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
        admin: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
        reviewer: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    }
    return colors[role]
}

// Granular permission checking (async - fetches from database)
export async function checkUserPermission(
    userRole: UserRole,
    permission: string
): Promise<boolean> {
    // Superadmin always has all permissions
    if (userRole === 'superadmin') {
        return true
    }

    try {
        const dbConnect = (await import('@/lib/mongodb')).default
        const PermissionSet = (await import('@/models/Permissions/permissionsSchema')).default

        await dbConnect()

        const permissionSet = await PermissionSet.findOne({ role: userRole })
        if (!permissionSet) {
            return false
        }

        return permissionSet.permissions.includes(permission as any)
    } catch (error) {
        console.error('Error checking permission:', error)
        return false
    }
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
        superadmin: [], // Will return true above
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
