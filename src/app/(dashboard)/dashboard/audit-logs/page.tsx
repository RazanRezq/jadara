import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { AuditLogsClient } from "./_components/audit-logs-client"

export default async function AuditLogsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access audit logs
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <AuditLogsClient />
}
