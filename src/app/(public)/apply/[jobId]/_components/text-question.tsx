"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowLeft, ArrowRight, Send } from "lucide-react"

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
        startedAt: Date
        completedAt: Date
    }) => void
}

export function TextQuestion({
    question,
    questionNumber,
    totalQuestions,
    onSubmit,
}: TextQuestionProps) {
    const { t, locale } = useTranslate()
    const [answer, setAnswer] = useState("")
    const startedAtRef = useRef(new Date())
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const isRTL = locale === "ar"
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

    useEffect(() => {
        // Reset for new question
        startedAtRef.current = new Date()
        setAnswer("")
        textareaRef.current?.focus()
    }, [questionNumber])

    const handleSubmit = () => {
        if (!answer.trim()) return

        onSubmit({
            type: "text",
            answer: answer.trim(),
            startedAt: startedAtRef.current,
            completedAt: new Date(),
        })
    }

    const charCount = answer.length
    const minChars = 50
    const isValidLength = charCount >= minChars

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="gap-1.5">
                        <FileText className="size-3" />
                        {t("apply.textQuestion")}
                    </Badge>
                    <Badge variant="outline">
                        {questionNumber} / {totalQuestions}
                    </Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                    {question.text}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={t("apply.typeAnswer")}
                        className="min-h-[200px] resize-none text-base leading-relaxed"
                        dir="auto"
                    />
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
                </div>

                {!isValidLength && charCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {t("apply.minCharacters", { count: minChars - charCount })}
                    </p>
                )}

                <Button
                    size="lg"
                    className="w-full h-12 text-base gap-2"
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
            </CardContent>
        </Card>
    )
}

