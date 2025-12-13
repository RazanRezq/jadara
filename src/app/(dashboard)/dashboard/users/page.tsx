import { getSession } from "@/lib/session"
import { hasPermission } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersClient } from "./_components/users-client"

export default async function UsersPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only admin and superadmin can access this page
    if (!hasPermission(session.role, "admin")) {
        redirect("/dashboard")
    }

    return <UsersClient currentUserRole={session.role} />
}
