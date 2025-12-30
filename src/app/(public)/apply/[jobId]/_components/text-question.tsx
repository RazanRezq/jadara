"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, ArrowLeft, ArrowRight, Send, Lock, CheckCircle2 } from "lucide-react"
import type { QuestionResponse } from "./store"

interface Question {
    text: string
    type: "text" | "voice"
    weight: number
}

interface TextQuestionProps {
    question: Question
    questionNumber: number
    totalQuestions: number
    onSubmit: (response: {
        type: "text"
        answer: string
        startedAt: string
        completedAt: string
        isAutoSubmitted: boolean
    }) => void
    // Anti-cheat props
    existingResponse?: QuestionResponse
    readOnly?: boolean
    onNext?: () => void
    onBack?: () => void
}

export function TextQuestion({
    question,
    questionNumber,
    totalQuestions,
    onSubmit,
    existingResponse,
    readOnly = false,
    onNext,
    onBack,
}: TextQuestionProps) {
    const { t, locale } = useTranslate()
    const [answer, setAnswer] = useState(existingResponse?.answer || "")
    const startedAtRef = useRef(new Date().toISOString())
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const isRTL = locale === "ar"
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight
    const ArrowPrev = isRTL ? ArrowRight : ArrowLeft

    useEffect(() => {
        // Load existing answer if available
        if (existingResponse?.answer) {
            setAnswer(existingResponse.answer)
        } else if (!readOnly) {
            // Reset for new question
            startedAtRef.current = new Date().toISOString()
            setAnswer("")
            textareaRef.current?.focus()
        }
    }, [questionNumber, readOnly, existingResponse])

    const handleSubmit = () => {
        if (!answer.trim() || readOnly) return

        onSubmit({
            type: "text",
            answer: answer.trim(),
            startedAt: existingResponse?.startedAt || startedAtRef.current,
            completedAt: new Date().toISOString(),
            isAutoSubmitted: false,
        })
    }

    const handleNext = () => {
        if (onNext) {
            onNext()
        }
    }

    const charCount = answer.length
    const minChars = 50
    const isValidLength = charCount >= minChars

    return (
        <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="gap-1.5">
                        <FileText className="size-3" />
                        {t("apply.textQuestion")}
                    </Badge>
                    <div className="flex items-center gap-2">
                        {readOnly && (
                            <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                <CheckCircle2 className="size-3" />
                                {t("apply.answered") || "Answered"}
                            </Badge>
                        )}
                        <Badge variant="outline">
                            {questionNumber} / {totalQuestions}
                        </Badge>
                    </div>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                    {question.text}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Read-Only Warning */}
                {readOnly && (
                    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <Lock className="size-4 text-amber-600" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                            {t("apply.readOnlyWarning") || "This question has already been answered. You cannot edit your response."}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => !readOnly && setAnswer(e.target.value)}
                        placeholder={readOnly ? "" : t("apply.typeAnswer")}
                        className={`min-h-[200px] resize-none text-base leading-relaxed ${readOnly ? "bg-muted/50 cursor-not-allowed opacity-80" : ""
                            }`}
                        dir={locale === "ar" ? "rtl" : "ltr"}
                        readOnly={readOnly}
                        disabled={readOnly}
                    />
                    {!readOnly && (
                        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                            <span
                                className={
                                    isValidLength ? "text-green-500" : "text-muted-foreground"
                                }
                            >
                                {charCount}
                            </span>
                            <span className="text-muted-foreground"> / {minChars}+</span>
                        </div>
                    )}
                </div>

                {!readOnly && !isValidLength && charCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {t("apply.minCharacters").replace("{{count}}", String(minChars - charCount))}
                    </p>
                )}

                {/* Action Buttons */}
                {readOnly ? (
                    // Read-only mode: Show "Back" and "Next" buttons
                    <div className="flex gap-3">
                        {onBack && (
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 text-base gap-2"
                                onClick={onBack}
                            >
                                {isRTL && t("common.back")}
                                <ArrowPrev className="size-4" />
                                {!isRTL && t("common.back")}
                            </Button>
                        )}
                        <Button
                            size="lg"
                            className="flex-1 h-12 text-base gap-2"
                            onClick={handleNext}
                        >
                            {questionNumber < totalQuestions ? (
                                <>
                                    {isRTL && t("apply.nextQuestion")}
                                    <ArrowIcon className="size-4" />
                                    {!isRTL && t("apply.nextQuestion")}
                                </>
                            ) : (
                                <>
                                    {isRTL && (t("apply.continueToUpload") || "Continue")}
                                    <ArrowIcon className="size-4" />
                                    {!isRTL && (t("apply.continueToUpload") || "Continue")}
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    // Normal mode: Show "Back" and submit button
                    <div className="flex gap-3">
                        {onBack && (
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 text-base gap-2"
                                onClick={onBack}
                            >
                                {isRTL && t("common.back")}
                                <ArrowPrev className="size-4" />
                                {!isRTL && t("common.back")}
                            </Button>
                        )}
                        <Button
                            size="lg"
                            className="flex-1 h-12 text-base gap-2"
                            onClick={handleSubmit}
                            disabled={!isValidLength}
                        >
                            {questionNumber < totalQuestions ? (
                                <>
                                    {t("apply.nextQuestion")}
                                    <ArrowIcon className="size-4" />
                                </>
                            ) : (
                                <>
                                    {t("apply.submitAnswer")}
                                    <Send className="size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
