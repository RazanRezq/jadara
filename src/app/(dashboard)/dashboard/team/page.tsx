import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UnderConstruction } from "@/components/under-construction"
import { hasPermission } from "@/lib/auth"

export default async function TeamPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Check if user has admin permission
    if (!hasPermission(session.role, "admin")) {
        redirect("/dashboard")
    }

    return <UnderConstruction />
}





