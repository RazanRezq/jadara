import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { EditJobPageClient } from "./_components/edit-job-page-client"

export default async function EditJobPage({
    params,
}: {
    params: Promise<{ jobId: string }>
}) {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    const { jobId } = await params

    return <EditJobPageClient jobId={jobId} userId={session.userId} />
}







