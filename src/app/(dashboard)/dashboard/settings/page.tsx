import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/auth"
import { SettingsClient } from "./_components/settings-client"

export default async function SettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only admin and superadmin can access settings
    if (!hasPermission(session.role, "admin")) {
        redirect("/dashboard")
    }

    return <SettingsClient userRole={session.role} />
}







