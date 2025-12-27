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
    console.log('[Auth Middleware] Step 1: Attempting to get session...')
    const session = await getSession()

    console.log('[Auth Middleware] Step 2: Session retrieved:', session ? '✅ YES' : '❌ NO')
    if (session) {
      console.log('[Auth Middleware] Session details:', {
        userId: session.userId,
        name: session.name,
        role: session.role,
        email: session.email,
      })
    }

    if (!session) {
      console.warn('[Auth Middleware] ❌ No session found - returning 401')
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Attach user info to context
    c.set('user', {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    })

    console.log('[Auth Middleware] Step 3: User attached to context successfully')
    await next()
  } catch (error) {
    console.error('[Auth Middleware] ❌ ERROR:', error)
    console.error('[Auth Middleware] Error details:', error instanceof Error ? error.message : 'Unknown error')
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
    console.error('[getAuthUser] ❌ No user in context! This should not happen after authenticate middleware.')
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
