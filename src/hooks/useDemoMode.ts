"use client"

import { useMemo } from "react"
import { isDemoUser as checkIsDemoUser, DEMO_USER_EMAIL } from "@/lib/demoMode"

interface UseDemoModeProps {
    email?: string | null
}

interface UseDemoModeReturn {
    isDemo: boolean
    demoEmail: string
    showDemoWarning: () => void
}

/**
 * Hook to check if the current user is in demo mode
 * and provide utilities for handling demo mode restrictions
 */
export function useDemoMode({ email }: UseDemoModeProps): UseDemoModeReturn {
    const isDemo = useMemo(() => checkIsDemoUser(email), [email])

    const showDemoWarning = () => {
        // This can be enhanced to show a toast notification
        // For now, just log to console
        console.warn('[Demo Mode] This action is disabled in demo mode.')
    }

    return {
        isDemo,
        demoEmail: DEMO_USER_EMAIL,
        showDemoWarning,
    }
}
