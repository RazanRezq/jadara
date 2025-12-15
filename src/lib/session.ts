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
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value

    if (!session) return null

    return verifyToken(session)
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}




