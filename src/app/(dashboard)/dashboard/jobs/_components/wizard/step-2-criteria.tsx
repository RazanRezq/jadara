"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, SKILL_SUGGESTIONS, Skill } from "./types"
import { Plus, Trash2, HelpCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step2CriteriaProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step2Criteria({ form }: Step2CriteriaProps) {
    const { t, locale } = useTranslate()
    
    const skills = form.watch('skills') || []
    const minExperience = form.watch('minExperience') || 0
    const autoRejectThreshold = form.watch('autoRejectThreshold') || 35

    const addSkill = (skillName?: string) => {
        const currentSkills = form.getValues('skills') || []
        const newSkill: Skill = {
            name: skillName || '',
            importance: 'required',
        }
        form.setValue('skills', [...currentSkills, newSkill])
    }

    const removeSkill = (index: number) => {
        const currentSkills = form.getValues('skills') || []
        form.setValue('skills', currentSkills.filter((_, i) => i !== index))
    }

    const updateSkill = (index: number, field: keyof Skill, value: string) => {
        const currentSkills = form.getValues('skills') || []
        const updatedSkills = [...currentSkills]
        updatedSkills[index] = { ...updatedSkills[index], [field]: value }
        form.setValue('skills', updatedSkills)
    }

    const existingSkillNames = skills.map(s => s.name.toLowerCase())
    const availableSuggestions = SKILL_SUGGESTIONS.filter(
        s => !existingSkillNames.includes(s.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step2.title")}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {t("jobWizard.step2.subtitle")}
                </p>
            </div>

            {/* Skills Matrix */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-end">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{t("jobWizard.step2.skillsMatrix")}</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t("jobWizard.step2.skillsMatrixHint")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            {t("jobWizard.step2.skillsMatrixDesc")}
                        </p>
                    </div>
                    {skills.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            {skills.length} {t("jobWizard.step2.skillsAdded")}
                        </Badge>
                    )}
                </div>

                {/* Skills List */}
                <div className="space-y-3">
                    {skills.map((skill, index) => (
                        <div 
                            key={index} 
                            className={cn(
                                "flex items-center gap-3 p-4 border rounded-lg bg-background transition-all",
                                "hover:shadow-md hover:border-primary/20",
                                "animate-in fade-in slide-in-from-top-2 duration-300"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => removeSkill(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <Select
                                value={skill.importance}
                                onValueChange={(value) => updateSkill(index, 'importance', value)}
                            >
                                <SelectTrigger className={cn(
                                    "w-32 transition-all",
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
                                className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    ))}
                </div>

                {/* Add Skill Button */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => addSkill()}
                >
                    <Plus className="h-4 w-4 me-2" />
                    {t("jobWizard.step2.addSkill")}
                </Button>

                {/* Smart Suggestions */}
                {availableSuggestions.length > 0 && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                {t("jobWizard.step2.smartSuggestions")}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.slice(0, 6).map((suggestion) => (
                                <Badge
                                    key={suggestion}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all hover:scale-105"
                                    onClick={() => addSkill(suggestion)}
                                >
                                    {suggestion}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Experience Requirements */}
            <div className="space-y-4 border-t pt-6">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step2.experienceReqs")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("jobWizard.step2.experienceReqsDesc")}
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="minExperience"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <div className="px-2 py-4 bg-muted/30 rounded-lg">
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
                                <p className="text-primary font-bold text-2xl mb-1">
                                    {minExperience}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t("jobWizard.step2.yearsMinimum")}
                                </p>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            {/* Auto-Reject Threshold */}
            <div className="space-y-4 border-t pt-6">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step2.autoRejectThreshold")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("jobWizard.step2.autoRejectThresholdDesc")}
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="autoRejectThreshold"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <div className="px-2 py-4 bg-muted/30 rounded-lg">
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
                                <p className="text-primary font-bold text-2xl mb-1">
                                    {autoRejectThreshold}%
                                </p>
                                <p className="text-sm text-muted-foreground">
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

