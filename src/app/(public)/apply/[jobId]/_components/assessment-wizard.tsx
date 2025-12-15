"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { TextQuestion } from "./text-question"
import { VoiceQuestion } from "./voice-question"
import { FileUploadStep } from "./file-upload-step"
import { ThankYouPage } from "./thank-you-page"
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Mic,
    Upload,
    PartyPopper,
    ArrowLeft,
    ArrowRight,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

interface Job {
    id: string
    title: string
    description: string
    candidateDataConfig: {
        requireCV: boolean
        requireLinkedIn: boolean
        requirePortfolio: boolean
    }
    candidateInstructions: string
    questions: Array<{
        text: string
        type: "text" | "voice"
        weight: number
        timeLimit?: string
        hideTextUntilRecording?: boolean
    }>
}

interface AssessmentWizardProps {
    job: Job
    sessionId: string
    applicantId: string
}

type QuestionResponse = {
    questionIndex: number
    type: "text" | "voice"
    answer?: string
    audioBlob?: Blob
    audioDuration?: number
    startedAt?: Date
    completedAt?: Date
    isAutoSubmitted?: boolean
}

type WizardStep = "instructions" | "questions" | "upload" | "complete"

export function AssessmentWizard({
    job,
    sessionId,
    applicantId,
}: AssessmentWizardProps) {
    const { t, locale } = useTranslate()
    const [currentStep, setCurrentStep] = useState<WizardStep>("instructions")
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [responses, setResponses] = useState<QuestionResponse[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [cvFile, setCvFile] = useState<File | null>(null)
    const [portfolioFile, setPortfolioFile] = useState<File | null>(null)
    const [cvUrl, setCvUrl] = useState<string | null>(null)
    const hasVisibilityListenerRef = useRef(false)

    const isRTL = locale === "ar"
    const ArrowNext = isRTL ? ArrowLeft : ArrowRight
    const ArrowPrev = isRTL ? ArrowRight : ArrowLeft

    // Session tracking - flag as suspicious if tab is hidden during voice exam
    const flagAsSuspicious = useCallback(
        async (reason: string) => {
            try {
                await fetch(`/api/applicants/flag-suspicious/${sessionId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                })
            } catch (error) {
                console.error("Failed to flag session:", error)
            }
        },
        [sessionId]
    )

    useEffect(() => {
        if (hasVisibilityListenerRef.current) return
        hasVisibilityListenerRef.current = true

        const handleVisibilityChange = () => {
            if (document.hidden && currentStep === "questions") {
                const currentQuestion = job.questions[currentQuestionIndex]
                if (currentQuestion?.type === "voice") {
                    flagAsSuspicious("Tab hidden during voice exam")
                    toast.warning(t("apply.tabWarning"))
                }
            }
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (
                currentStep === "questions" ||
                currentStep === "upload"
            ) {
                e.preventDefault()
                e.returnValue = t("apply.leaveWarning")
                return e.returnValue
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [currentStep, currentQuestionIndex, job.questions, flagAsSuspicious, t])

    const currentQuestion = job.questions[currentQuestionIndex]
    const totalQuestions = job.questions.length
    const progress =
        currentStep === "instructions"
            ? 0
            : currentStep === "questions"
                ? ((currentQuestionIndex + 1) / (totalQuestions + 2)) * 100
                : currentStep === "upload"
                    ? ((totalQuestions + 1) / (totalQuestions + 2)) * 100
                    : 100

    const handleQuestionSubmit = async (response: Omit<QuestionResponse, "questionIndex">) => {
        const fullResponse: QuestionResponse = {
            ...response,
            questionIndex: currentQuestionIndex,
        }

        setResponses((prev) => [...prev, fullResponse])

        // Submit response to server
        try {
            const formData = new FormData()
            formData.append("applicantId", applicantId)
            formData.append("questionId", `q_${currentQuestionIndex}`)
            formData.append("type", response.type)

            if (response.type === "text" && response.answer) {
                formData.append("textAnswer", response.answer)
            }

            if (response.type === "voice" && response.audioBlob) {
                formData.append("audio", response.audioBlob, "recording.webm")
                if (response.audioDuration) {
                    formData.append("audioDuration", response.audioDuration.toString())
                }
            }

            if (response.startedAt) {
                formData.append("startedAt", response.startedAt.toISOString())
            }
            if (response.completedAt) {
                formData.append("completedAt", response.completedAt.toISOString())
            }
            if (response.isAutoSubmitted) {
                formData.append("isAutoSubmitted", "true")
            }

            await fetch("/api/responses/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId,
                    questionId: `q_${currentQuestionIndex}`,
                    type: response.type,
                    textAnswer: response.type === "text" ? response.answer : undefined,
                    audioDuration: response.audioDuration,
                    startedAt: response.startedAt?.toISOString(),
                    completedAt: response.completedAt?.toISOString() || new Date().toISOString(),
                    isAutoSubmitted: response.isAutoSubmitted || false,
                }),
            })
        } catch (error) {
            console.error("Failed to submit response:", error)
        }

        // Move to next question or upload step
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex((prev) => prev + 1)
        } else {
            // Check if we need file uploads
            if (
                job.candidateDataConfig.requireCV ||
                job.candidateDataConfig.requirePortfolio
            ) {
                setCurrentStep("upload")
            } else {
                await submitApplication()
            }
        }
    }

    const handleFileUpload = async () => {
        setIsSubmitting(true)
        try {
            // In a real app, you'd upload files to storage here
            // For now, we'll simulate file upload
            let uploadedCvUrl = cvUrl

            if (cvFile) {
                // Simulate file upload - in production, use S3/Cloudinary/etc
                uploadedCvUrl = URL.createObjectURL(cvFile)
                setCvUrl(uploadedCvUrl)
            }

            await submitApplication(uploadedCvUrl || undefined)
        } catch (error) {
            toast.error(t("common.error"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const submitApplication = async (cvUrlParam?: string) => {
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/applicants/submit/${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cvUrl: cvUrlParam || cvUrl,
                }),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            // Clear session from localStorage
            localStorage.removeItem(`apply_session_${job.id}`)

            setCurrentStep("complete")
            toast.success(t("apply.applicationSubmitted"))
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : t("common.error")
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStepIcon = (step: WizardStep) => {
        switch (step) {
            case "instructions":
                return <FileText className="size-5" />
            case "questions":
                return currentQuestion?.type === "voice" ? (
                    <Mic className="size-5" />
                ) : (
                    <FileText className="size-5" />
                )
            case "upload":
                return <Upload className="size-5" />
            case "complete":
                return <PartyPopper className="size-5" />
        }
    }

    const getStepLabel = () => {
        switch (currentStep) {
            case "instructions":
                return t("apply.instructions")
            case "questions":
                return `${t("apply.question")} ${currentQuestionIndex + 1} / ${totalQuestions}`
            case "upload":
                return t("apply.uploadDocuments")
            case "complete":
                return t("apply.complete")
        }
    }

    if (currentStep === "complete") {
        return <ThankYouPage jobTitle={job.title} />
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Sparkles className="size-5 text-primary-foreground" />
                        </div>
                        <div>
                            <span className="font-bold text-sm">SmartRecruit</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {job.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="gap-1.5 hidden sm:flex"
                        >
                            {getStepIcon(currentStep)}
                            {getStepLabel()}
                        </Badge>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
                <Progress value={progress} className="h-1 rounded-none" />
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-2xl">
                    {/* Instructions Step */}
                    {currentStep === "instructions" && (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <AlertCircle className="size-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">
                                    {t("apply.beforeYouStart")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {job.candidateInstructions ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                                        <p className="text-muted-foreground whitespace-pre-line">
                                            {job.candidateInstructions}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                                            <p className="text-muted-foreground">
                                                {t("apply.instructionMic")}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                                            <p className="text-muted-foreground">
                                                {t("apply.instructionQuiet")}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                                            <p className="text-muted-foreground">
                                                {t("apply.instructionTimer")}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                                            <p className="text-muted-foreground">
                                                {t("apply.instructionNoRetake")}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Question breakdown */}
                                <div className="p-4 rounded-lg bg-secondary/50">
                                    <h3 className="font-medium mb-3">
                                        {t("apply.assessmentOverview")}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-4 text-muted-foreground" />
                                            <span>
                                                {job.questions.filter((q) => q.type === "text").length}{" "}
                                                {t("apply.textQuestions")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mic className="size-4 text-muted-foreground" />
                                            <span>
                                                {job.questions.filter((q) => q.type === "voice").length}{" "}
                                                {t("apply.voiceQuestions")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full h-12 text-base gap-2"
                                    onClick={() => setCurrentStep("questions")}
                                >
                                    {t("apply.startAssessment")}
                                    <ArrowNext className="size-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Questions Step */}
                    {currentStep === "questions" && currentQuestion && (
                        <div
                            key={currentQuestionIndex}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                        >
                            {currentQuestion.type === "text" ? (
                                <TextQuestion
                                    question={currentQuestion}
                                    questionNumber={currentQuestionIndex + 1}
                                    totalQuestions={totalQuestions}
                                    onSubmit={handleQuestionSubmit}
                                />
                            ) : (
                                <VoiceQuestion
                                    question={currentQuestion}
                                    questionNumber={currentQuestionIndex + 1}
                                    totalQuestions={totalQuestions}
                                    onSubmit={handleQuestionSubmit}
                                />
                            )}
                        </div>
                    )}

                    {/* File Upload Step */}
                    {currentStep === "upload" && (
                        <FileUploadStep
                            requireCV={job.candidateDataConfig.requireCV}
                            requirePortfolio={job.candidateDataConfig.requirePortfolio}
                            cvFile={cvFile}
                            portfolioFile={portfolioFile}
                            onCvChange={setCvFile}
                            onPortfolioChange={setPortfolioFile}
                            onSubmit={handleFileUpload}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}


