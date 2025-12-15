import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { SettingsClient } from "./_components/settings-client"

export default async function SettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return <SettingsClient userRole={session.role} />
}


