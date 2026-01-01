"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormField,
    FormItem,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, Skill, ScreeningQuestion, Language, PROFICIENCY_LEVELS, COMMON_LANGUAGES, LANGUAGE_TRANSLATIONS } from "./types"
import { Plus, Trash2, ShieldAlert, Globe2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface Step2CriteriaProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step2Criteria({ form }: Step2CriteriaProps) {
    const { t, locale, isRTL } = useTranslate()

    const skills = form.watch('skills') || []
    const screeningQuestions = form.watch('screeningQuestions') || []
    const languages = form.watch('languages') || []
    const minExperience = form.watch('minExperience') || 0
    const autoRejectThreshold = form.watch('autoRejectThreshold') || 35

    // === Manual Skill Management ===
    const addSkill = (skillName?: string) => {
        const currentSkills = form.getValues('skills') || []
        const newSkill: Skill = {
            name: skillName || '',
            importance: 'required',
        }
        form.setValue('skills', [...currentSkills, newSkill], { shouldValidate: true, shouldDirty: true })
    }

    const removeSkill = (index: number) => {
        const currentSkills = form.getValues('skills') || []
        form.setValue('skills', currentSkills.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true })
    }

    const updateSkill = (index: number, field: keyof Skill, value: string) => {
        const currentSkills = form.getValues('skills') || []
        const updatedSkills = [...currentSkills]
        updatedSkills[index] = { ...updatedSkills[index], [field]: value }
        form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true })
    }

    // === Section B: Screening Questions ===
    const addScreeningQuestion = () => {
        const current = form.getValues('screeningQuestions') || []
        const newQuestion: ScreeningQuestion = {
            question: '',
            idealAnswer: true,  // Default to "Yes"
            disqualify: false,
        }
        form.setValue('screeningQuestions', [...current, newQuestion], { shouldValidate: true, shouldDirty: true })
    }

    const removeScreeningQuestion = (index: number) => {
        const current = form.getValues('screeningQuestions') || []
        form.setValue('screeningQuestions', current.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true })
    }

    const updateScreeningQuestion = (index: number, field: keyof ScreeningQuestion, value: string | boolean) => {
        const current = form.getValues('screeningQuestions') || []
        const updated = [...current]
        updated[index] = { ...updated[index], [field]: value }
        form.setValue('screeningQuestions', updated, { shouldValidate: true, shouldDirty: true })
    }

    // === Section C: Languages ===
    const addLanguage = () => {
        const current = form.getValues('languages') || []
        const newLanguage: Language = {
            language: '',
            level: 'intermediate',
        }
        form.setValue('languages', [...current, newLanguage], { shouldValidate: true, shouldDirty: true })
    }

    const removeLanguage = (index: number) => {
        const current = form.getValues('languages') || []
        form.setValue('languages', current.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true })
    }

    const updateLanguage = (index: number, field: keyof Language, value: string) => {
        const current = form.getValues('languages') || []
        const updated = [...current]

        // If updating language name, convert localized name back to English for storage
        if (field === 'language') {
            const langKey = Object.keys(LANGUAGE_TRANSLATIONS).find(
                key => value === LANGUAGE_TRANSLATIONS[key]?.en ||
                    value === LANGUAGE_TRANSLATIONS[key]?.ar
            )
            updated[index] = { ...updated[index], language: langKey || value }
        } else {
            // For level field, we know it's a valid proficiency level
            updated[index] = { ...updated[index], level: value as Language['level'] }
        }

        form.setValue('languages', updated, { shouldValidate: true, shouldDirty: true })
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-5">
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step2.title")}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                    {t("jobWizard.step2.subtitle")}
                </p>
            </div>

            {/* === SECTION A: Skills Matrix === */}
            <div className="space-y-4 p-5 sm:p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold">{t("jobWizard.step2.skillsMatrix")}</h3>
                    <p className="text-muted-foreground text-xs">
                        {t("jobWizard.step2.skillsMatrixDesc")}
                    </p>
                </div>

                {/* Skills List */}
                {skills.length > 0 && (
                    <div className="space-y-2">
                        {skills.map((skill, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center gap-2.5 p-3 border rounded-lg bg-background transition-all",
                                    "hover:shadow-md hover:border-primary/20"
                                )}
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => removeSkill(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <Select
                                    value={skill.importance}
                                    onValueChange={(value) => updateSkill(index, 'importance', value)}
                                >
                                    <SelectTrigger className={cn(
                                        "w-28 h-9 text-sm transition-all",
                                        skill.importance === 'required' && "border-primary/50 bg-primary/5"
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="required">
                                            {t("jobWizard.step2.required")}
                                        </SelectItem>
                                        <SelectItem value="preferred">
                                            {t("jobWizard.step2.preferred")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    value={skill.name}
                                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                    placeholder={t("jobWizard.step2.skillName")}
                                    className="flex-1 h-9 text-sm transition-all focus:ring-2 focus:ring-primary/20 min-w-0"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Skill Button */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed hover:border-primary hover:bg-primary/5 transition-all h-9 text-sm"
                    onClick={() => addSkill()}
                >
                    <Plus className="h-4 w-4 me-2" />
                    {t("jobWizard.step2.addSkill")}
                </Button>

                {/* Skills Count Badge */}
                {skills.length > 0 && (
                    <div className="flex items-center justify-center">
                        <Badge variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                            {skills.length} {t("jobWizard.step2.skillsAdded")}
                        </Badge>
                    </div>
                )}
            </div>

            <Separator className="my-6" />

            {/* === SECTION B: Screening Questions === */}
            <div className="space-y-4 p-5 sm:p-6 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-gray-50/30 to-transparent dark:from-gray-900/10">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold">{t("jobWizard.step2.screeningQuestions")}</h3>
                        <p className="text-muted-foreground text-xs">
                            {t("jobWizard.step2.screeningQuestionsDesc")}
                        </p>
                    </div>
                </div>

                {/* Screening Questions List */}
                <div className="space-y-3">
                    {screeningQuestions.map((sq, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 border rounded-lg bg-background hover:shadow-md transition-all"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors mt-1"
                                onClick={() => removeScreeningQuestion(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="flex-1 space-y-3 min-w-0">
                                <Input
                                    value={sq.question}
                                    onChange={(e) => updateScreeningQuestion(index, 'question', e.target.value)}
                                    placeholder={t("jobWizard.step2.questionPlaceholder")}
                                    className="h-10 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                                />

                                {/* Ideal Answer Selection */}
                                <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                                    <Label className="text-xs font-medium">
                                        {t("jobWizard.step2.idealAnswer")}
                                    </Label>
                                    <RadioGroup
                                        value={String(sq.idealAnswer)}
                                        onValueChange={(value) => updateScreeningQuestion(index, 'idealAnswer', value === 'true')}
                                        className={cn("flex gap-6", isRTL && "flex-row-reverse")}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <RadioGroupItem value="true" id={`ideal-yes-${index}`} />
                                            <Label htmlFor={`ideal-yes-${index}`} className="cursor-pointer font-normal text-sm">
                                                {t("common.yes")}
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <RadioGroupItem value="false" id={`ideal-no-${index}`} />
                                            <Label htmlFor={`ideal-no-${index}`} className="cursor-pointer font-normal text-sm">
                                                {t("common.no")}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {t("jobWizard.step2.idealAnswerHint")}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2.5">
                                        <Switch
                                            checked={sq.disqualify}
                                            onCheckedChange={(checked) => updateScreeningQuestion(index, 'disqualify', checked)}
                                            id={`disqualify-${index}`}
                                        />
                                        <Label htmlFor={`disqualify-${index}`} className="text-sm font-medium cursor-pointer">
                                            {t("jobWizard.step2.disqualifyIfMismatch")}
                                        </Label>
                                    </div>
                                    {sq.disqualify && (
                                        <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                            {t("jobWizard.step2.disqualifying")}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-all h-10 text-sm"
                    onClick={addScreeningQuestion}
                >
                    <Plus className="h-4 w-4 me-2" />
                    {t("jobWizard.step2.addScreeningQuestion")}
                </Button>
            </div>

            <Separator className="my-6" />

            {/* === SECTION C: Languages === */}
            <div className="space-y-4 p-5 sm:p-6 border-2 border-green-200/50 dark:border-green-900/50 rounded-xl bg-gradient-to-br from-green-50/30 to-transparent dark:from-green-950/10">
                <div className="flex items-start gap-3">
                    <Globe2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold">{t("jobWizard.step2.languages")}</h3>
                        <p className="text-muted-foreground text-xs">
                            {t("jobWizard.step2.languagesDesc")}
                        </p>
                    </div>
                </div>

                {/* Languages List */}
                <div className="space-y-2.5">
                    {languages.map((lang, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2.5 p-3 border rounded-lg bg-background hover:shadow-md transition-all"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => removeLanguage(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <Input
                                value={(() => {
                                    // Display localized name if it's a known language, otherwise show as-is
                                    if (LANGUAGE_TRANSLATIONS[lang.language]) {
                                        const translation = LANGUAGE_TRANSLATIONS[lang.language]
                                        return locale === 'ar' ? translation.ar : translation.en
                                    }
                                    return lang.language
                                })()}
                                onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                placeholder={t("jobWizard.step2.languagePlaceholder")}
                                className="flex-1 h-9 text-sm transition-all focus:ring-2 focus:ring-primary/20 min-w-0"
                                list={`languages-${index}`}
                            />
                            <datalist id={`languages-${index}`}>
                                {COMMON_LANGUAGES.map((l) => {
                                    const translation = LANGUAGE_TRANSLATIONS[l] || { en: l, ar: l }
                                    const displayName = locale === 'ar' ? translation.ar : translation.en
                                    return (
                                        <option key={l} value={displayName} />
                                    )
                                })}
                            </datalist>

                            <Select
                                value={lang.level}
                                onValueChange={(value) => updateLanguage(index, 'level', value)}
                            >
                                <SelectTrigger className="w-32 h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFICIENCY_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {locale === 'ar' ? level.label : level.labelEn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all h-9 text-sm"
                    onClick={addLanguage}
                >
                    <Plus className="h-4 w-4 me-2" />
                    {t("jobWizard.step2.addLanguage")}
                </Button>
            </div>

            <Separator className="my-6" />

            {/* === SECTION D: Minimum Experience === */}
            <div className="space-y-4 p-5 sm:p-6 border-2 border-purple-200/50 dark:border-purple-900/50 rounded-xl bg-gradient-to-br from-purple-50/30 to-transparent dark:from-purple-950/10">
                <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold">{t("jobWizard.step2.minExperience")}</h3>
                        <p className="text-muted-foreground text-xs">
                            {t("jobWizard.step2.minExperienceDesc")}
                        </p>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="minExperience"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <div className="px-4 py-5 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-900/50">
                                <Slider
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    max={15}
                                    min={0}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-primary font-bold text-3xl mb-0.5">
                                    {minExperience}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {minExperience === 0
                                        ? (locale === 'ar' ? 'بدون خبرة مطلوبة' : 'No experience required')
                                        : `${minExperience} ${t("jobWizard.step2.years")}`
                                    }
                                </p>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            {/* Auto-Reject Threshold */}
            <div className="space-y-3 p-5 sm:p-6 border-2 border-border rounded-xl bg-muted/20">
                <div>
                    <h3 className="font-semibold text-base">{t("jobWizard.step2.autoRejectThreshold")}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {t("jobWizard.step2.autoRejectThresholdDesc")}
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="autoRejectThreshold"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <div className="px-4 py-4 bg-muted/30 rounded-lg border border-border">
                                <Slider
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    max={100}
                                    min={0}
                                    step={5}
                                    className="w-full"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-primary font-bold text-2xl mb-0.5">
                                    {autoRejectThreshold}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t("jobWizard.step2.minimumScore")}
                                </p>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
