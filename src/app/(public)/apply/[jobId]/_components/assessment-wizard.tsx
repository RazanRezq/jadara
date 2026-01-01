"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { TextQuestion } from "./text-question"
import { VoiceQuestion } from "./voice-question"
import { FileUploadStep } from "./file-upload-step"
import { PersonalInfoStep } from "./personal-info-step"
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Mic,
    Upload,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Check,
    Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useApplicationStore, type QuestionResponse, type PersonalData } from "./store"
import { submitApplication, uploadAudio, checkExistingApplication } from "./actions"

interface Job {
    id: string
    title: string
    description: string
    currency?: string
    screeningQuestions: Array<{ question: string; disqualify: boolean }>
    languages: Array<{ language: string; level: string }>
    candidateDataConfig: {
        requireCV: boolean
        requireLinkedIn: boolean
        requirePortfolio: boolean
        hideSalaryExpectation: boolean
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
    onBackToLanding?: () => void
}

type WizardStep = "personalInfo" | "instructions" | "questions" | "upload" | "complete"

export function AssessmentWizard({ job, onBackToLanding }: AssessmentWizardProps) {
    const { t, locale } = useTranslate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const hasVisibilityListenerRef = useRef(false)

    // Zustand store
    const {
        wizardStep,
        currentQuestionIndex,
        personalData,
        setWizardStep,
        setCurrentQuestionIndex,
        setPersonalData,
        addResponse,
        hasResponseForQuestion,
        getResponseForQuestion,
        setFileUpload,
        flagAsSuspicious,
        markAsSubmitted,
        getSubmissionPayload,
    } = useApplicationStore()

    const isRTL = locale === "ar"
    const ArrowNext = isRTL ? ArrowLeft : ArrowRight
    const ArrowPrev = isRTL ? ArrowRight : ArrowLeft

    const currentQuestion = job.questions[currentQuestionIndex]
    const totalQuestions = job.questions.length

    // Scroll to top on wizard step change or question change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [wizardStep, currentQuestionIndex])

    // Define wizard steps for the indicator
    const wizardSteps = [
        { id: "personalInfo", number: 1, label: t("apply.personalInfo") },
        { id: "instructions", number: 2, label: t("apply.instructions") },
        { id: "questions", number: 3, label: t("apply.assessment") },
        { id: "upload", number: 4, label: t("apply.uploadDocuments") },
    ]

    // Calculate current step number
    const getCurrentStepNumber = () => {
        switch (wizardStep) {
            case "personalInfo":
                return 1
            case "instructions":
                return 2
            case "questions":
                return 3
            case "upload":
                return 4
            default:
                return 1
        }
    }

    const currentStepNumber = getCurrentStepNumber()

    // Check if current question already has a response (for read-only mode)
    const currentQuestionHasResponse = hasResponseForQuestion(currentQuestionIndex)
    const currentQuestionResponse = getResponseForQuestion(currentQuestionIndex)

    // Only voice questions are read-only after recording (to maintain authenticity)
    // Text questions can be edited to fix typos/mistakes
    const isCurrentQuestionReadOnly = currentQuestionHasResponse && currentQuestion?.type === "voice"

    // Session tracking - flag as suspicious if tab is hidden during voice exam
    const handleFlagSuspicious = useCallback(
        (reason: string) => {
            flagAsSuspicious(reason)
            toast.warning(t("apply.tabWarning"))
        },
        [flagAsSuspicious, t]
    )

    useEffect(() => {
        if (hasVisibilityListenerRef.current) return
        hasVisibilityListenerRef.current = true

        const handleVisibilityChange = () => {
            if (document.hidden && wizardStep === "questions") {
                const currentQ = job.questions[currentQuestionIndex]
                if (currentQ?.type === "voice") {
                    handleFlagSuspicious("Tab hidden during voice exam")
                }
            }
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (wizardStep === "questions" || wizardStep === "upload") {
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
    }, [wizardStep, currentQuestionIndex, job.questions, handleFlagSuspicious, t])

    /**
     * Handle question submission - stores in Zustand, not DB
     */
    const handleQuestionSubmit = async (response: Omit<QuestionResponse, "questionIndex">) => {
        const fullResponse: QuestionResponse = {
            ...response,
            questionIndex: currentQuestionIndex,
        }

        // For voice questions, upload audio to cloud and get URL
        if (response.type === "voice" && response.audioUrl) {
            // Audio URL should already be set from the voice-question component
            // after uploading to cloud storage
        }

        // Store response in Zustand (NOT in database)
        addResponse(fullResponse)

        // Move to next question or upload step
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
            // Check if we need file uploads
            if (
                job.candidateDataConfig.requireCV ||
                job.candidateDataConfig.requirePortfolio
            ) {
                setWizardStep("upload")
            } else {
                // No file uploads needed - submit directly
                await handleFinalSubmit()
            }
        }
    }

    /**
     * Handle personal info submission
     */
    const handlePersonalInfoSubmit = async (data: PersonalData) => {
        try {
            // Check if already applied (duplicate check)
            const { exists } = await checkExistingApplication(job.id, data.email)

            if (exists) {
                throw new Error(t("apply.alreadyApplied") || "You have already applied for this position")
            }

            // Store personal data in Zustand (NOT in database)
            setPersonalData(data)

            // Move to instructions step
            setWizardStep("instructions")
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : t("common.error")
            )
        }
    }

    /**
     * Handle going back to previous step/question
     */
    const handleGoBack = () => {
        if (wizardStep === "personalInfo") {
            // Go back to landing page
            if (onBackToLanding) {
                onBackToLanding()
            }
            return
        } else if (wizardStep === "instructions") {
            // Go back to personal info
            setWizardStep("personalInfo")
        } else if (wizardStep === "questions") {
            if (currentQuestionIndex > 0) {
                // Go to previous question
                setCurrentQuestionIndex(currentQuestionIndex - 1)
            } else {
                // Go back to instructions
                setWizardStep("instructions")
            }
        } else if (wizardStep === "upload") {
            // Go back to last question or instructions if no questions
            if (totalQuestions > 0) {
                setWizardStep("questions")
                setCurrentQuestionIndex(totalQuestions - 1)
            } else {
                setWizardStep("instructions")
            }
        }
    }

    /**
     * Check if back button should be shown
     */
    const canGoBack = true // Always show back button, including on instructions step

    /**
     * Handle file upload completion
     */
    const handleFileUploadComplete = async (cvUrl?: string, portfolioUrl?: string) => {
        // Update Zustand store with file URLs
        if (cvUrl) {
            setFileUpload({ cvUrl })
        }
        if (portfolioUrl) {
            setFileUpload({ portfolioUrl })
        }

        // Now submit everything
        await handleFinalSubmit()
    }

    /**
     * FINAL SUBMISSION - This is the ONLY point where we save to the database
     */
    const handleFinalSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Get the complete payload from Zustand
            const payload = getSubmissionPayload()

            // Submit to database (atomic operation)
            const result = await submitApplication(payload)

            if (!result.success) {
                throw new Error(result.error || "Submission failed")
            }

            // Mark as submitted in store
            markAsSubmitted()

            // No toast needed - the Thank You page is sufficient feedback
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
                return <CheckCircle2 className="size-5" />
        }
    }

    const getStepLabel = () => {
        switch (wizardStep) {
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

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/95 border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    {/* Top Row: Logo, Title, and Controls */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
                                <Sparkles className="size-5 text-primary-foreground" />
                            </div>
                            <div>
                                <span className="font-bold text-sm">SmartRecruit</span>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]" dir="auto">
                                    {job.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-2" dir={isRTL ? "rtl" : "ltr"}>
                        {wizardSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                {/* Step Circle */}
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                                        currentStepNumber > step.number
                                            ? "bg-primary text-primary-foreground scale-110"
                                            : currentStepNumber === step.number
                                                ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary ring-offset-2"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {currentStepNumber > step.number ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                {/* Connector Line */}
                                {index < wizardSteps.length - 1 && (
                                    <div
                                        className={cn(
                                            "w-8 sm:w-12 h-1 mx-1 sm:mx-2 transition-all duration-300 rounded-full",
                                            currentStepNumber > step.number
                                                ? "bg-primary"
                                                : "bg-muted"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Info */}
                    <div className="text-center mt-3">
                        <p className="text-xs text-muted-foreground">
                            {wizardSteps[currentStepNumber - 1]?.label}
                            {wizardStep === "questions" && totalQuestions > 0 && (
                                <span className="ms-1">
                                    ({currentQuestionIndex + 1} / {totalQuestions})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-45 pb-16 px-4">
                <div className="container mx-auto max-w-2xl">
                    {/* Personal Info Step */}
                    {wizardStep === "personalInfo" && (
                        <PersonalInfoStep
                            job={job}
                            existingData={personalData}
                            onSubmit={handlePersonalInfoSubmit}
                            onBack={onBackToLanding}
                            isSubmitting={false}
                        />
                    )}

                    {/* Instructions Step */}
                    {wizardStep === "instructions" && (
                        <Card className="border-2 border-border bg-card shadow-sm">
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
                                        <p className="text-muted-foreground whitespace-pre-line" dir="auto">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

                                <div className="flex gap-3">
                                    {canGoBack && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="h-12 text-base gap-2"
                                            onClick={handleGoBack}
                                        >
                                            {!isRTL && t("common.back")}
                                            <ArrowPrev className="size-4" />
                                            {isRTL && t("common.back")}
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        className="flex-1 h-12 text-base gap-2"
                                        dir={isRTL ? "rtl" : "ltr"}
                                        onClick={() => {
                                            if (totalQuestions === 0) {
                                                // Skip questions step if no questions
                                                if (job.candidateDataConfig.requireCV || job.candidateDataConfig.requirePortfolio) {
                                                    setWizardStep("upload")
                                                } else {
                                                    handleFinalSubmit()
                                                }
                                            } else {
                                                setWizardStep("questions")
                                            }
                                        }}
                                    >
                                        <span>{totalQuestions === 0 ? t("common.next") : t("apply.startAssessment")}</span>
                                        <ArrowNext className="size-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Questions Step */}
                    {wizardStep === "questions" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {totalQuestions === 0 ? (
                                /* No Questions - Show friendly message */
                                <Card className="border-2 border-border bg-card shadow-sm">
                                    <CardHeader className="text-center">
                                        <div className="mx-auto mb-4 size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Info className="size-8 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl">
                                            {t("apply.noQuestionsTitle")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <p className="text-center text-muted-foreground">
                                            {t("apply.noQuestionsMessage")}
                                        </p>

                                        <div className="flex gap-3">
                                            {canGoBack && (
                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    className="h-12 text-base gap-2"
                                                    onClick={handleGoBack}
                                                >
                                                    {!isRTL && t("common.back")}
                                                    <ArrowPrev className="size-4" />
                                                    {isRTL && t("common.back")}
                                                </Button>
                                            )}
                                            <Button
                                                size="lg"
                                                className="flex-1 h-12 text-base gap-2"
                                                dir={isRTL ? "rtl" : "ltr"}
                                                onClick={() => {
                                                    if (job.candidateDataConfig.requireCV || job.candidateDataConfig.requirePortfolio) {
                                                        setWizardStep("upload")
                                                    } else {
                                                        handleFinalSubmit()
                                                    }
                                                }}
                                            >
                                                <span>{t("common.next")}</span>
                                                <ArrowNext className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : currentQuestion ? (
                                /* Has Questions - Normal flow */
                                <div key={currentQuestionIndex}>
                                    {currentQuestion.type === "text" ? (
                                        <TextQuestion
                                            question={currentQuestion}
                                            questionNumber={currentQuestionIndex + 1}
                                            totalQuestions={totalQuestions}
                                            onSubmit={handleQuestionSubmit}
                                            existingResponse={currentQuestionResponse}
                                            readOnly={false}
                                            onNext={() => {
                                                if (currentQuestionIndex < totalQuestions - 1) {
                                                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                                                } else if (job.candidateDataConfig.requireCV || job.candidateDataConfig.requirePortfolio) {
                                                    setWizardStep("upload")
                                                }
                                            }}
                                            onBack={canGoBack ? handleGoBack : undefined}
                                        />
                                    ) : (
                                        <VoiceQuestion
                                            question={currentQuestion}
                                            questionNumber={currentQuestionIndex + 1}
                                            totalQuestions={totalQuestions}
                                            onSubmit={handleQuestionSubmit}
                                            existingResponse={currentQuestionResponse}
                                            readOnly={isCurrentQuestionReadOnly}
                                            onNext={() => {
                                                if (currentQuestionIndex < totalQuestions - 1) {
                                                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                                                } else if (job.candidateDataConfig.requireCV || job.candidateDataConfig.requirePortfolio) {
                                                    setWizardStep("upload")
                                                }
                                            }}
                                            onBack={canGoBack ? handleGoBack : undefined}
                                        />
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* File Upload Step */}
                    {wizardStep === "upload" && (
                        <FileUploadStep
                            requireCV={job.candidateDataConfig.requireCV}
                            requirePortfolio={job.candidateDataConfig.requirePortfolio}
                            onSubmit={handleFileUploadComplete}
                            isSubmitting={isSubmitting}
                            onBack={canGoBack ? handleGoBack : undefined}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}
