import 'server-only'
import { cookies } from 'next/headers'
import { createToken, verifyToken, type SessionPayload } from './auth'

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const session = await createToken(payload)

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })

    return session
}

export async function getSession(): Promise<SessionPayload | null> {
    console.log('[getSession] Step 1: Getting cookie store...')
    const cookieStore = await cookies()

    console.log('[getSession] Step 2: Looking for session cookie...')
    const sessionCookie = cookieStore.get('session')
    const session = sessionCookie?.value

    console.log('[getSession] Step 3: Session cookie found?', session ? '✅ YES' : '❌ NO')
    if (!session) {
        console.warn('[getSession] ⚠️  No session cookie found. Available cookies:', cookieStore.getAll().map(c => c.name))
        return null
    }

    console.log('[getSession] Step 4: Verifying token...')
    const verified = await verifyToken(session)
    console.log('[getSession] Step 5: Token verified?', verified ? '✅ YES' : '❌ NO')

    return verified
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}














