"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Check, ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react"

import { JobWizardFormValues, defaultJobWizardValues } from "./types"
import { createLocalizedJobWizardSchema } from "./validation"
import { Step1Basics } from "./step-1-basics"
import { Step2Criteria } from "./step-2-criteria"
import { Step3CandidateData } from "./step-3-candidate-data"
import { Step4ExamBuilder } from "./step-4-exam-builder"
import { Step5Review } from "./step-5-review"

interface JobWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    userId: string
}

const TOTAL_STEPS = 5

export function JobWizardDialog({ open, onOpenChange, onSuccess, userId }: JobWizardDialogProps) {
    const { t, locale, isRTL } = useTranslate()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    // Ref to scroll container
    const contentRef = useRef<HTMLDivElement>(null)

    // Create localized schema based on current locale
    const localizedSchema = useMemo(() => createLocalizedJobWizardSchema(t), [t])

    const form = useForm<JobWizardFormValues>({
        resolver: zodResolver(localizedSchema),
        defaultValues: defaultJobWizardValues,
        mode: "onChange",
    })

    // Scroll to top helper
    const scrollToTop = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Scroll to top when step changes
    useEffect(() => {
        scrollToTop()
    }, [currentStep])

    // Reset on open and scroll to top
    useEffect(() => {
        if (open) {
            setCurrentStep(1)
            setValidationErrors([])
            form.reset(defaultJobWizardValues)
            // Scroll to top when dialog opens
            setTimeout(() => scrollToTop(), 100)
        }
    }, [open, form])

    const steps = [
        { number: 1, title: t("jobWizard.step1.title"), subtitle: t("jobWizard.step1.subtitle") },
        { number: 2, title: t("jobWizard.step2.title"), subtitle: t("jobWizard.step2.subtitle") },
        { number: 3, title: t("jobWizard.step3.title"), subtitle: t("jobWizard.step3.subtitle") },
        { number: 4, title: t("jobWizard.step4.title"), subtitle: t("jobWizard.step4.subtitle") },
        { number: 5, title: t("jobWizard.step5.title"), subtitle: t("jobWizard.step5.subtitle") },
    ]

    const validateCurrentStep = async (): Promise<boolean> => {
        let fieldsToValidate: (keyof JobWizardFormValues)[] = []

        switch (currentStep) {
            case 1:
                fieldsToValidate = ['title', 'description', 'employmentType', 'currency']
                break
            case 2:
                fieldsToValidate = ['skills', 'minExperience', 'autoRejectThreshold']
                break
            case 3:
                fieldsToValidate = ['candidateDataConfig']
                break
            case 4:
                fieldsToValidate = ['questions', 'retakePolicy']
                break
            case 5:
                return true
        }

        const result = await form.trigger(fieldsToValidate)
        return result
    }

    const handleNext = async () => {
        const isValid = await validateCurrentStep()
        if (!isValid) {
            const errors = form.formState.errors
            const errorMessages: string[] = []

            // Collect error messages
            Object.keys(errors).forEach((key) => {
                const error = errors[key as keyof typeof errors]
                if (error?.message) {
                    errorMessages.push(error.message as string)
                }
            })

            setValidationErrors(errorMessages)
            toast.error(t("jobWizard.validationError"))

            // Scroll to first error
            const firstError = document.querySelector('[data-invalid="true"]')
            firstError?.scrollIntoView({ behavior: "smooth", block: "center" })
            return
        }

        setValidationErrors([])
        setIsTransitioning(true)

        // Smooth transition
        setTimeout(() => {
            if (currentStep < TOTAL_STEPS) {
                setCurrentStep(prev => prev + 1)
            }
            setIsTransitioning(false)
        }, 150)
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentStep(prev => prev - 1)
                setValidationErrors([])
                setIsTransitioning(false)
            }, 150)
        }
    }

    // Helper function to convert field errors to user-friendly localized messages
    const getLocalizedErrorMessage = (field: string, errors: string | string[]): string => {
        const errorArray = Array.isArray(errors) ? errors : [errors]
        const firstError = errorArray[0]?.toLowerCase() || ''

        // Map field names to localized labels
        const fieldLabels: Record<string, string> = {
            title: t("jobWizard.validationErrors.title"),
            description: t("jobWizard.validationErrors.description"),
            skills: t("jobWizard.validationErrors.skills"),
            languages: t("jobWizard.validationErrors.languages"),
            questions: t("jobWizard.validationErrors.questions"),
            screeningQuestions: t("jobWizard.validationErrors.screeningQuestions"),
            employmentType: t("jobWizard.validationErrors.employmentType"),
            currency: t("jobWizard.validationErrors.currency"),
            candidateDataConfig: t("jobWizard.validationErrors.candidateDataConfig"),
            retakePolicy: t("jobWizard.validationErrors.retakePolicy"),
        }

        const fieldLabel = fieldLabels[field] || field

        // Check for specific error patterns and return user-friendly messages
        if (field === 'languages' && firstError.includes('language')) {
            return t("jobWizard.validation.emptyLanguageEntry")
        }

        if (field === 'skills' && (firstError.includes('skill') || firstError.includes('name'))) {
            return t("jobWizard.validation.emptySkillEntry")
        }

        if (field === 'questions' && (firstError.includes('question') || firstError.includes('text'))) {
            return t("jobWizard.validation.emptyQuestionEntry")
        }

        if (firstError.includes('required')) {
            return `${fieldLabel}: ${t("jobWizard.validation.fieldRequired")}`
        }

        if (firstError.includes('at least 3')) {
            return t("jobWizard.validation.titleMin")
        }

        if (firstError.includes('at least 10')) {
            return t("jobWizard.validation.descriptionMin")
        }

        // Default: return the field with the original error
        return `${fieldLabel}: ${errorArray.join(', ')}`
    }

    const handleSubmit = async (status: 'draft' | 'active') => {
        setLoading(true)
        try {
            const values = form.getValues()

            // Debug: uncomment to see submitted data
            // console.log('[Job Submit] Submitting job data:', JSON.stringify(values, null, 2))

            const response = await fetch(`/api/jobs/add?userId=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    status,
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(
                    status === 'active'
                        ? t("jobWizard.jobPublished")
                        : t("jobWizard.jobSavedAsDraft")
                )
                form.reset(defaultJobWizardValues)
                setCurrentStep(1)
                onOpenChange(false)
                onSuccess()
            } else {
                // Debug: uncomment to see validation errors
                // console.error('[Job Submit] Validation failed:', data.details)

                // Display user-friendly localized validation errors
                if (data.details && Object.keys(data.details).length > 0) {
                    const errorMessages = Object.entries(data.details)
                        .map(([field, errors]) => getLocalizedErrorMessage(field, errors as string | string[]))
                        .filter(Boolean)

                    // Show toast with localized error messages
                    toast.error(
                        <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
                            <div className="font-semibold">{t("jobWizard.pleaseFixErrors")}</div>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                                {errorMessages.map((msg, index) => (
                                    <li key={index}>{msg}</li>
                                ))}
                            </ul>
                        </div>,
                        { duration: 8000 }
                    )
                } else {
                    toast.error(t("jobWizard.validationError"))
                }
            }
        } catch (error) {
            console.error("Submit error:", error)
            toast.error(t("common.error"))
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        form.reset(defaultJobWizardValues)
        setCurrentStep(1)
        onOpenChange(false)
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Basics form={form} />
            case 2:
                return <Step2Criteria form={form} />
            case 3:
                return <Step3CandidateData form={form} />
            case 4:
                return <Step4ExamBuilder form={form} />
            case 5:
                return <Step5Review form={form} />
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
                showCloseButton={true}
            >
                {/* Header with Stepper */}
                <div className="p-6 sm:p-8 pb-4 border-b bg-gradient-to-b from-background to-muted/20">
                    <DialogTitle className="text-xl font-semibold text-primary text-center mb-4">
                        {t("jobWizard.title")}
                    </DialogTitle>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-2 mb-4" dir={isRTL ? "rtl" : "ltr"}>
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                {/* Step Circle */}
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm",
                                        currentStep > step.number
                                            ? "bg-primary text-primary-foreground scale-110 shadow-md"
                                            : currentStep === step.number
                                                ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary ring-offset-2 shadow-md"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {currentStep > step.number ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "w-12 h-1 mx-2 transition-all duration-300 rounded-full",
                                            currentStep > step.number
                                                ? "bg-primary"
                                                : "bg-muted"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Info */}
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                            {t("jobWizard.step")} {currentStep} {t("common.of")} {TOTAL_STEPS}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {steps[currentStep - 1]?.subtitle}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div ref={contentRef} className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-destructive mb-1">
                                        {t("jobWizard.pleaseFixErrors")}
                                    </p>
                                    <ul className="text-xs text-destructive/80 list-disc list-inside space-y-1">
                                        {validationErrors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form className="space-y-6">
                            <div
                                className={cn(
                                    "transition-all duration-300",
                                    isTransitioning && "opacity-0 translate-y-2"
                                )}
                            >
                                {renderStep()}
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 pt-4 border-t bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4" dir={isRTL ? "rtl" : "ltr"}>
                    {/* Previous Button - Left in LTR, Right in RTL */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1 || loading || isTransitioning}
                        className="gap-2 w-full sm:w-auto"
                    >
                        {isRTL ? (
                            <>
                                <ArrowRight className="h-4 w-4" />
                                {t("common.previous")}
                            </>
                        ) : (
                            <>
                                <ArrowLeft className="h-4 w-4" />
                                {t("common.previous")}
                            </>
                        )}
                    </Button>

                    {/* Next/Submit Buttons - Right in LTR, Left in RTL */}
                    <div className="flex gap-3 w-full sm:w-auto">
                        {currentStep === TOTAL_STEPS ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none"
                                >
                                    {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                    {t("jobWizard.saveAsDraft")}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleSubmit('active')}
                                    disabled={loading}
                                    className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                >
                                    {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                    {t("jobWizard.publishJob")}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={loading || isTransitioning}
                                className="gap-2 w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            >
                                {isRTL ? (
                                    <>
                                        {t("common.next")}
                                        <ArrowLeft className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        {t("common.next")}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

