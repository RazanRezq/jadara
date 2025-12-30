import { ApplyClient } from "./_components/apply-client"

interface ApplyPageProps {
    params: Promise<{
        jobId: string
    }>
}

export default async function ApplyPage({ params }: ApplyPageProps) {
    const { jobId } = await params

    return <ApplyClient jobId={jobId} />
}

