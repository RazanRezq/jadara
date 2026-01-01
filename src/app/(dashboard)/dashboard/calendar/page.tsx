import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { CalendarClient } from "./_components/calendar-client"

export default async function CalendarPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-6">
            <CalendarClient userRole={session.role} />
        </div>
    )
}







