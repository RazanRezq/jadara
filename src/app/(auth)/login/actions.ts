"use server"

import { createSession, deleteSession } from "@/lib/session"
import type { UserRole } from "@/lib/auth"

export async function loginAction(userData: {
    userId: string
    email: string
    name: string
    role: UserRole
}) {
    await createSession(userData)
}

export async function logoutAction() {
    await deleteSession()
}
