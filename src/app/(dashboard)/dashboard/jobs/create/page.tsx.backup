import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/authClient"
import { JobCreateClient } from "./_components/job-create-client"

export default async function JobCreatePage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only admin and superadmin can create jobs
    if (!hasPermission(session.role, "jobs.create")) {
        redirect("/dashboard/jobs")
    }

    return <JobCreateClient userId={session.userId} />
}
