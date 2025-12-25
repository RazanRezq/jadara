"use server"

import { createSession, deleteSession, getSession } from "@/lib/session"
import type { UserRole } from "@/lib/auth"
import { headers } from "next/headers"
import dbConnect from "@/lib/mongodb"
import Session from "@/models/Sessions/sessionSchema"
import { createToken } from "@/lib/auth"
import { createHash } from "crypto"
import { logUserAction } from "@/lib/auditLogger"

// Helper to detect device type from user agent
function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase()
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        return /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile'
    }
    return 'desktop'
}

// Helper to extract browser from user agent
function getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
}

// Helper to extract OS from user agent
function getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
}

export async function loginAction(userData: {
    userId: string
    email: string
    name: string
    role: UserRole
}) {
    // Create JWT session cookie
    await createSession(userData)

    // Get request metadata
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      '127.0.0.1'

    // Create session record in database
    try {
        await dbConnect()

        // Generate session token hash from JWT
        const token = await createToken(userData)
        const sessionToken = createHash('sha256').update(token).digest('hex')
        const sessionId = createHash('sha256').update(`${userData.userId}-${Date.now()}`).digest('hex')

        // Create session document
        await Session.create({
            userId: userData.userId,
            userEmail: userData.email,
            userName: userData.name,
            userRole: userData.role,
            sessionToken,
            sessionId,
            ipAddress,
            userAgent,
            deviceType: getDeviceType(userAgent),
            browser: getBrowser(userAgent),
            os: getOS(userAgent),
            isActive: true,
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })

        // Log successful login
        await logUserAction(
            {
                userId: userData.userId,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            },
            'user.login',
            'User',
            userData.userId,
            `User logged in from ${ipAddress}`,
            {
                resourceName: userData.email,
                metadata: {
                    ipAddress,
                    userAgent,
                    deviceType: getDeviceType(userAgent),
                    browser: getBrowser(userAgent),
                    os: getOS(userAgent),
                },
                severity: 'info',
            }
        )
    } catch (error) {
        console.error('Failed to create session record:', error)
        // Don't block login if session recording fails
    }
}

export async function logoutAction() {
    try {
        // Get current session info for audit logging
        const session = await getSession()

        if (session) {
            await dbConnect()

            // Get session record to revoke
            const sessionRecord = await Session.findOne({
                userId: session.userId,
                isActive: true,
            }).sort({ createdAt: -1 })

            if (sessionRecord) {
                await sessionRecord.revoke(session.userId, 'User logged out')

                // Log logout action
                await logUserAction(
                    {
                        userId: session.userId,
                        email: session.email,
                        name: session.name,
                        role: session.role,
                    },
                    'user.logout',
                    'Session',
                    sessionRecord._id.toString(),
                    'User logged out',
                    {
                        resourceName: session.email,
                        severity: 'info',
                    }
                )
            }
        }
    } catch (error) {
        console.error('Failed to revoke session record:', error)
    }

    // Always delete the session cookie
    await deleteSession()
}
