import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { SessionsClient } from "./_components/sessions-client"

export default async function SessionsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access session management
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <SessionsClient />
}
