import { Suspense } from "react"
import { ApplyClient } from "./_components/apply-client"
import { Spinner } from "@/components/ui/spinner"

interface ApplyPageProps {
    params: Promise<{
        jobId: string
    }>
}

export default async function ApplyPage({ params }: ApplyPageProps) {
    const { jobId } = await params

    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Spinner className="size-8" />
                </div>
            }
        >
            <ApplyClient jobId={jobId} />
        </Suspense>
    )
}

