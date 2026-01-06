import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { CalendarClient } from "./_components/calendar-client"
import { PageHeader } from "@/components/page-header"

export default async function CalendarPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-6 space-y-4">
            {/* Page Header */}
            <PageHeader
                titleKey="sidebar.calendar"
                className="px-0 pt-0"
            />

            <CalendarClient userRole={session.role} />
        </div>
    )
}
















