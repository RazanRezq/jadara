"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { JobLanding } from "./job-landing"
import { AssessmentWizard } from "./assessment-wizard"
import { ThankYouPage } from "./thank-you-page"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useApplicationStore, type PersonalData } from "./store"
import { checkExistingApplication } from "./actions"
import { toast } from "sonner"

interface Job {
    id: string
    title: string
    description: string
    department: string
    location: string
    employmentType: string
    currency?: string
    skills: Array<{ name: string; importance: string }>
    screeningQuestions: Array<{ question: string; disqualify: boolean }>
    languages: Array<{ language: string; level: string }>
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

    // Zustand store
    const {
        personalData,
        wizardStep,
        isSubmitted,
        jobId: storedJobId,
        jobTitle,
        initSession,
        setWizardStep,
        resetSession,
    } = useApplicationStore()

    // Determine if user has started the wizard
    // User has started if they have a session for this job (initiated by clicking start button)
    const hasStarted = storedJobId === jobId && wizardStep !== null

    // Fetch job data
    const fetchJob = useCallback(async () => {
        try {
            const response = await fetch(`/api/jobs/public/${jobId}`)
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

            // Initialize session if it's the same job (for recovery)
            if (storedJobId === jobId && personalData && !isSubmitted) {
                // Session recovery - don't reset
            } else if (storedJobId !== jobId) {
                // Different job - reset session
                resetSession()
            }
        } catch {
            setError(t("common.error"))
        } finally {
            setLoading(false)
        }
    }, [jobId, t, storedJobId, personalData, isSubmitted, resetSession])

    useEffect(() => {
        fetchJob()
    }, [fetchJob])

    /**
     * Handle starting the application - just initializes the wizard
     */
    const handleStartApplication = () => {
        // Initialize the session in Zustand
        initSession(jobId, job?.title || "")
        // Wizard will start at personalInfo step by default
    }

    /**
     * Handle going back to landing page from wizard
     */
    const handleBackToLanding = () => {
        // Reset to show landing page
        setWizardStep("personalInfo")
        resetSession()
    }

    // Show loading state
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

    // Show error state
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

    // Show thank you page if already submitted
    if (isSubmitted || wizardStep === "complete") {
        return <ThankYouPage jobTitle={jobTitle || job.title} />
    }

    // Show landing if not started
    if (!hasStarted) {
        return (
            <JobLanding job={job} onStartApplication={handleStartApplication} />
        )
    }

    // Show assessment wizard (includes personal info form as first step)
    return <AssessmentWizard job={job} onBackToLanding={handleBackToLanding} />
}
