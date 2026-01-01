"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, Question, TIME_LIMIT_OPTIONS } from "./types"
import { Plus, Trash2, HelpCircle, FileQuestion, Mic, Type } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step4ExamBuilderProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step4ExamBuilder({ form }: Step4ExamBuilderProps) {
    const { t, locale } = useTranslate()
    
    const questions = form.watch('questions') || []
    const allowRetake = form.watch('retakePolicy.allowRetake')

    const addQuestion = () => {
        const currentQuestions = form.getValues('questions') || []
        const newQuestion: Question = {
            text: '',
            type: 'text',
            weight: 5,
            timeLimit: '1min',
            hideTextUntilRecording: false,
        }
        form.setValue('questions', [...currentQuestions, newQuestion])
    }

    const removeQuestion = (index: number) => {
        const currentQuestions = form.getValues('questions') || []
        form.setValue('questions', currentQuestions.filter((_, i) => i !== index))
    }

    const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
        const currentQuestions = form.getValues('questions') || []
        const updatedQuestions = [...currentQuestions]
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
        form.setValue('questions', updatedQuestions)
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-5">
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step4.title")}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                    {t("jobWizard.step4.subtitle")}
                </p>
            </div>

            {/* Candidate Instructions */}
            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-sm">{t("jobWizard.step4.candidateInstructions")}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {t("jobWizard.step4.candidateInstructionsDesc")}
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="candidateInstructions"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder={t("jobWizard.step4.instructionsPlaceholder")}
                                    rows={3}
                                    className="text-sm resize-none"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {/* Questions Builder */}
            <div className="space-y-4 border-t pt-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{t("jobWizard.step4.questionBuilder")}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">{t("jobWizard.step4.questionBuilderHint")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                            {t("jobWizard.step4.questionBuilderDesc")}
                        </p>
                    </div>
                    {questions.length > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                            <FileQuestion className="h-3 w-3" />
                            {questions.length} {t("jobWizard.step4.questionsAdded")}
                        </Badge>
                    )}
                </div>

                <div className="space-y-3">
                    {questions.map((question, index) => (
                        <div
                            key={index}
                            className={cn(
                                "border rounded-lg p-4 space-y-3 bg-background transition-all",
                                "hover:shadow-md hover:border-primary/20",
                                "animate-in fade-in slide-in-from-top-2 duration-300"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Question Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center",
                                        question.type === 'voice'
                                            ? "bg-blue-500/10 text-blue-600"
                                            : "bg-purple-500/10 text-purple-600"
                                    )}>
                                        {question.type === 'voice' ? (
                                            <Mic className="h-3.5 w-3.5" />
                                        ) : (
                                            <Type className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    <h4 className="font-medium text-sm">
                                        {t("jobWizard.step4.question")} {index + 1}
                                    </h4>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => removeQuestion(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Question Text */}
                            <Input
                                value={question.text}
                                onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                                placeholder={t("jobWizard.step4.questionText")}
                                className="h-9 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                            />

                            {/* Type & Weight */}
                            <div className="flex gap-2 items-start">
                                <div className="flex-1 max-w-xs space-y-1.5">
                                    <label className="text-xs font-medium">
                                        {t("jobWizard.step4.questionType")}
                                    </label>
                                    <Select
                                        value={question.type}
                                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                                    >
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">
                                                {t("jobWizard.step4.textType")}
                                            </SelectItem>
                                            <SelectItem value="voice">
                                                {t("jobWizard.step4.voiceType")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1 max-w-[140px] space-y-1.5">
                                    <label className="text-xs font-medium">
                                        {t("jobWizard.step4.weight")} (1-10)
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={question.weight}
                                        onChange={(e) => updateQuestion(index, 'weight', Number(e.target.value))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Voice-specific options */}
                            {question.type === 'voice' && (
                                <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">
                                            {t("jobWizard.step4.timeLimit")}
                                        </label>
                                        <Select
                                            value={question.timeLimit}
                                            onValueChange={(value) => updateQuestion(index, 'timeLimit', value)}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_LIMIT_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {locale === 'ar' ? option.label : option.labelEn}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id={`hideText-${index}`}
                                            checked={question.hideTextUntilRecording}
                                            onCheckedChange={(checked) =>
                                                updateQuestion(index, 'hideTextUntilRecording', checked)
                                            }
                                        />
                                        <label
                                            htmlFor={`hideText-${index}`}
                                            className="text-xs cursor-pointer"
                                        >
                                            {t("jobWizard.step4.hideUntilRecording")}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add Question Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed hover:border-primary hover:bg-primary/5 transition-all h-9 text-sm"
                        onClick={addQuestion}
                    >
                        <Plus className="h-4 w-4 me-2" />
                        {t("jobWizard.step4.addQuestion")}
                    </Button>
                </div>
            </div>

            {/* Retake Policy */}
            <div className="space-y-3 border-t pt-5">
                <div>
                    <h3 className="font-semibold text-sm">{t("jobWizard.step4.retakePolicy")}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {t("jobWizard.step4.retakePolicyDesc")}
                    </p>
                </div>

                <div className="space-y-3">
                    <FormField
                        control={form.control}
                        name="retakePolicy.allowRetake"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                        {t("jobWizard.step4.allowRetake")}
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                        {t("jobWizard.step4.allowRetakeDesc")}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {allowRetake && (
                        <FormField
                            control={form.control}
                            name="retakePolicy.maxAttempts"
                            render={({ field }) => (
                                <FormItem className="p-3 border rounded-lg space-y-1.5">
                                    <FormLabel className="text-xs font-medium">{t("jobWizard.step4.maxAttempts")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className="h-9 text-sm"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

