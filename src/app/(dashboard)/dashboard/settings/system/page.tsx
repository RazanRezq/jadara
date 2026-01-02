import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { SystemSettingsClient } from "./_components/system-settings-client"

export default async function SystemSettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access system settings
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <SystemSettingsClient />
}
