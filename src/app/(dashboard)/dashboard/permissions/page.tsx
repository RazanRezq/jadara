import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { PermissionsClient } from "./_components/permissions-client"

export default async function PermissionsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access permissions management
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return <PermissionsClient />
}
