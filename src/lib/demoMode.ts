/**
 * Demo Mode Configuration
 * 
 * This file contains constants and utilities for the read-only demo mode
 * used for portfolio demonstration purposes.
 */

// Demo user credentials - this user will be restricted to read-only mode
export const DEMO_USER_EMAIL = 'demo@jadara.app'
export const DEMO_USER_PASSWORD = 'demo123' // Must be at least 6 characters

// Check if an email belongs to the demo user
export function isDemoUser(email: string | undefined | null): boolean {
    if (!email) return false
    return email.toLowerCase() === DEMO_USER_EMAIL.toLowerCase()
}

// Error message for demo mode restrictions
export const DEMO_MODE_ERROR = {
    success: false,
    error: 'Demo Mode - Read Only',
    details: 'This action is disabled in Demo Mode. Data modifications are not allowed.',
}

// Allowed endpoints for demo users (these can still be accessed for write operations)
// For example, allowing demo users to submit job applications as candidates
export const DEMO_ALLOWED_WRITE_PATHS = [
    '/api/applicants/apply', // Allow submitting job applications
    '/api/users/login',      // Allow login
    '/api/users/logout',     // Allow logout
]

// Check if a path is allowed for demo users
export function isDemoAllowedPath(path: string): boolean {
    return DEMO_ALLOWED_WRITE_PATHS.some(allowedPath => 
        path.toLowerCase().startsWith(allowedPath.toLowerCase())
    )
}
