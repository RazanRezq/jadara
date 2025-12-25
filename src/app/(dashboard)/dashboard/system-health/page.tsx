import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { SystemHealthClient } from "./_components/system-health-client"

export default async function SystemHealthPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access system health monitoring
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <SystemHealthClient />
}
