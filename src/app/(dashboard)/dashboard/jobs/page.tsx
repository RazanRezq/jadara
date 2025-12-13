import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { JobsClient } from "./_components/jobs-client"

export default async function JobsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return <JobsClient currentUserRole={session.role} userId={session.userId} />
}
