"use client"

import { useEffect, useState } from 'react'
import { type UserRole } from '@/lib/auth'
import { hasGranularPermission } from '@/lib/authClient'

/**
 * Client-side hook to check if a user has a specific permission
 * Uses synchronous permission checking with default permission sets
 *
 * @param userRole - The user's role
 * @param permission - The permission to check (e.g., 'jobs.create', 'applicants.view')
 * @returns boolean indicating if user has the permission
 */
export function usePermission(userRole: UserRole | undefined, permission: string): boolean {
    const [hasPermission, setHasPermission] = useState(false)

    useEffect(() => {
        if (!userRole) {
            setHasPermission(false)
            return
        }

        setHasPermission(hasGranularPermission(userRole, permission))
    }, [userRole, permission])

    return hasPermission
}

/**
 * Client-side hook to check multiple permissions at once
 *
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns Object with permission names as keys and boolean values
 */
export function usePermissions(
    userRole: UserRole | undefined,
    permissions: string[]
): Record<string, boolean> {
    const [permissionMap, setPermissionMap] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (!userRole) {
            setPermissionMap({})
            return
        }

        const map: Record<string, boolean> = {}
        permissions.forEach(permission => {
            map[permission] = hasGranularPermission(userRole, permission)
        })
        setPermissionMap(map)
    }, [userRole, permissions])

    return permissionMap
}
