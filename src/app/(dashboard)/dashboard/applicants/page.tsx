import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { ApplicantsClient } from "./_components/applicants-client"

export default async function ApplicantsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return <ApplicantsClient currentUserRole={session.role} userId={session.userId} />
}
