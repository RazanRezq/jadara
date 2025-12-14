"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { JobLanding } from "./job-landing"
import { AssessmentWizard } from "./assessment-wizard"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Job {
    id: string
    title: string
    description: string
    department: string
    location: string
    employmentType: string
    skills: Array<{ name: string; importance: string }>
    minExperience: number
    candidateDataConfig: {
        requireCV: boolean
        requireLinkedIn: boolean
        requirePortfolio: boolean
        hideSalaryExpectation: boolean
        hidePersonalInfo: boolean
    }
    candidateInstructions: string
    questions: Array<{
        text: string
        type: "text" | "voice"
        weight: number
        timeLimit?: string
        hideTextUntilRecording?: boolean
    }>
    retakePolicy: {
        allowRetake: boolean
        maxAttempts: number
    }
    status: string
}

interface ApplyClientProps {
    jobId: string
}

export function ApplyClient({ jobId }: ApplyClientProps) {
    const { t } = useTranslate()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasStarted, setHasStarted] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [applicantId, setApplicantId] = useState<string | null>(null)

    const fetchJob = useCallback(async () => {
        try {
            const response = await fetch(`/api/jobs/${jobId}`)
            const data = await response.json()

            if (!data.success) {
                setError(data.error || t("apply.jobNotFound"))
                return
            }

            if (data.job.status !== "active") {
                setError(t("apply.jobClosed"))
                return
            }

            setJob(data.job)
        } catch {
            setError(t("common.error"))
        } finally {
            setLoading(false)
        }
    }, [jobId, t])

    useEffect(() => {
        fetchJob()
    }, [fetchJob])

    const handleStartApplication = async (personalData: {
        name: string
        email: string
        phone: string
        age?: number
        major?: string
        yearsOfExperience?: number
        salaryExpectation?: number
        linkedinUrl?: string
        portfolioUrl?: string
    }) => {
        try {
            const response = await fetch("/api/applicants/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobId,
                    personalData,
                }),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            setSessionId(data.applicant.sessionId)
            setApplicantId(data.applicant.id)
            setHasStarted(true)

            // Store session in localStorage for recovery
            localStorage.setItem(
                `apply_session_${jobId}`,
                JSON.stringify({
                    sessionId: data.applicant.sessionId,
                    applicantId: data.applicant.id,
                    startedAt: new Date().toISOString(),
                })
            )

            return data
        } catch (err) {
            throw err
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <Spinner className="size-8" />
                    <p className="text-muted-foreground animate-pulse">
                        {t("common.loading")}
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        const isJobClosed = error === t("apply.jobClosed")
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            {isJobClosed ? (
                                <Ban className="h-16 w-16 text-muted-foreground" />
                            ) : (
                                <AlertCircle className="h-16 w-16 text-destructive" />
                            )}
                            <div>
                                <h2 className="text-xl font-semibold mb-2">
                                    {isJobClosed
                                        ? t("apply.jobClosedTitle")
                                        : t("apply.errorTitle")}
                                </h2>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!job) {
        return null
    }

    if (!hasStarted) {
        return (
            <JobLanding job={job} onStartApplication={handleStartApplication} />
        )
    }

    return (
        <AssessmentWizard
            job={job}
            sessionId={sessionId!}
            applicantId={applicantId!}
        />
    )
}

