import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { NotificationsPageClient } from "./_components/notifications-page-client"

export default async function NotificationsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return <NotificationsPageClient userId={session.userId} />
}
