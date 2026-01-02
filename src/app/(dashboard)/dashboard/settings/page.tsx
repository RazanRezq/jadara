import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/auth"
import { SettingsClient } from "./_components/settings-client"

export default async function SettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access settings
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <SettingsClient userRole={session.role} />
}








