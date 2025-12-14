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
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step4.title")}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {t("jobWizard.step4.subtitle")}
                </p>
            </div>

            {/* Candidate Instructions */}
            <div className="space-y-4">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step4.candidateInstructions")}</h3>
                    <p className="text-muted-foreground text-sm">
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
                                    rows={4}
                                    {...field} 
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {/* Questions Builder */}
            <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                    <div className="text-end">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{t("jobWizard.step4.questionBuilder")}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t("jobWizard.step4.questionBuilderHint")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            {t("jobWizard.step4.questionBuilderDesc")}
                        </p>
                    </div>
                    {questions.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                            <FileQuestion className="h-3 w-3" />
                            {questions.length} {t("jobWizard.step4.questionsAdded")}
                        </Badge>
                    )}
                </div>

                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <div 
                            key={index} 
                            className={cn(
                                "border rounded-lg p-5 space-y-4 bg-background transition-all",
                                "hover:shadow-md hover:border-primary/20",
                                "animate-in fade-in slide-in-from-top-2 duration-300"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Question Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                                        question.type === 'voice' 
                                            ? "bg-blue-500/10 text-blue-600" 
                                            : "bg-purple-500/10 text-purple-600"
                                    )}>
                                        {question.type === 'voice' ? (
                                            <Mic className="h-4 w-4" />
                                        ) : (
                                            <Type className="h-4 w-4" />
                                        )}
                                    </div>
                                    <h4 className="font-medium">
                                        {t("jobWizard.step4.question")} {index + 1}
                                    </h4>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive transition-colors"
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
                                className="transition-all focus:ring-2 focus:ring-primary/20"
                            />

                            {/* Type & Weight */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("jobWizard.step4.questionType")}
                                    </label>
                                    <Select
                                        value={question.type}
                                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                                    >
                                        <SelectTrigger>
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("jobWizard.step4.weight")} (1-10)
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={question.weight}
                                        onChange={(e) => updateQuestion(index, 'weight', Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Voice-specific options */}
                            {question.type === 'voice' && (
                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t("jobWizard.step4.timeLimit")}
                                        </label>
                                        <Select
                                            value={question.timeLimit}
                                            onValueChange={(value) => updateQuestion(index, 'timeLimit', value)}
                                        >
                                            <SelectTrigger>
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

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`hideText-${index}`}
                                            checked={question.hideTextUntilRecording}
                                            onCheckedChange={(checked) => 
                                                updateQuestion(index, 'hideTextUntilRecording', checked)
                                            }
                                        />
                                        <label 
                                            htmlFor={`hideText-${index}`}
                                            className="text-sm cursor-pointer"
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
                        className="w-full border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={addQuestion}
                    >
                        <Plus className="h-4 w-4 me-2" />
                        {t("jobWizard.step4.addQuestion")}
                    </Button>
                </div>
            </div>

            {/* Retake Policy */}
            <div className="space-y-4 border-t pt-6">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step4.retakePolicy")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("jobWizard.step4.retakePolicyDesc")}
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="retakePolicy.allowRetake"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <FormLabel className="text-base font-medium cursor-pointer">
                                        {t("jobWizard.step4.allowRetake")}
                                    </FormLabel>
                                    <FormDescription>
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
                                <FormItem className="p-4 border rounded-lg">
                                    <FormLabel>{t("jobWizard.step4.maxAttempts")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
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

