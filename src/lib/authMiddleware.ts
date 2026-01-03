import { Context } from 'hono'
import { getSession } from './session'
import { hasPermission, checkUserPermission, UserRole } from './auth'

export interface AuthenticatedContext extends Context {
  user?: {
    userId: string
    email: string
    name: string
    role: UserRole
  }
}

/**
 * Middleware to verify user session and attach user info to context
 */
export async function authenticate(c: Context, next: () => Promise<void>) {
  try {
    const session = await getSession()

    if (!session) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Attach user info to context
    c.set('user', {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    })

    await next()
  } catch (error) {
    console.error('[Auth] Authentication failed:', error instanceof Error ? error.message : 'Unknown error')
    return c.json({ success: false, error: 'Authentication failed' }, 401)
  }
}

/**
 * Middleware to check if user has required role permission
 * @param requiredRole Minimum role required to access the route
 */
export function requireRole(requiredRole: UserRole) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    if (!hasPermission(user.role, requiredRole)) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          details: `This action requires ${requiredRole} role or higher`,
        },
        403
      )
    }

    await next()
  }
}

/**
 * Helper to get authenticated user from context
 */
export function getAuthUser(c: Context) {
  const user = c.get('user')
  if (!user) {
    throw new Error('User not authenticated')
  }
  return {
    id: user.userId,  // Map userId to id for backwards compatibility
    ...user,
  }
}

/**
 * Middleware to check if user has a specific granular permission
 * @param permission Permission to check (e.g., 'jobs.create', 'applicants.delete')
 */
export function requirePermission(permission: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Check granular permission from database
    const hasAccess = await checkUserPermission(user.role, permission)

    if (!hasAccess) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          details: `This action requires '${permission}' permission`,
        },
        403
      )
    }

    await next()
  }
}
