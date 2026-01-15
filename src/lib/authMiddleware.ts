import { Context } from 'hono'
import { getSession } from './session'
import { hasPermission, checkUserPermission, UserRole } from './auth'
import { isDemoUser, DEMO_MODE_ERROR, isDemoAllowedPath } from './demoMode'

export interface AuthenticatedContext extends Context {
  user?: {
    userId: string
    email: string
    name: string
    role: UserRole
    isDemo?: boolean
  }
}

/**
 * Middleware to verify user session and attach user info to context
 * Also enforces demo mode restrictions for write operations
 */
export async function authenticate(c: Context, next: () => Promise<void>) {
  try {
    const session = await getSession()

    if (!session) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Check if this is the demo user
    const isDemo = isDemoUser(session.email)
    
    // Debug logging for demo mode
    console.log(`[Auth] User: ${session.email}, isDemo: ${isDemo}`)

    // Attach user info to context
    c.set('user', {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      isDemo,
    })

    // Demo mode protection: Block write operations for demo users
    if (isDemo) {
      const method = c.req.method.toUpperCase()
      const path = c.req.path
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

      if (isWriteOperation && !isDemoAllowedPath(path)) {
        console.log(`[Demo Mode] Blocked ${method} request to ${path} for demo user`)
        return c.json(DEMO_MODE_ERROR, 403)
      }
    }

    await next()
  } catch (error) {
    console.error('[Auth] Authentication failed:', error instanceof Error ? error.message : 'Unknown error')
    return c.json({ success: false, error: 'Authentication failed' }, 401)
  }
}

/**
 * Standalone middleware to block write operations for demo users
 * NOTE: This is now integrated into the authenticate middleware above.
 * Kept for potential use cases where you need separate demo checking.
 */
export async function demoModeProtection(c: Context, next: () => Promise<void>) {
  const user = c.get('user')
  const method = c.req.method.toUpperCase()
  const path = c.req.path

  // Only check for write operations (POST, PUT, PATCH, DELETE)
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (user?.isDemo && isWriteOperation) {
    // Check if this path is allowed for demo users
    if (!isDemoAllowedPath(path)) {
      console.log(`[Demo Mode] Blocked ${method} request to ${path} for demo user`)
      return c.json(DEMO_MODE_ERROR, 403)
    }
  }

  await next()
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
