"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, CURRENCY_OPTIONS, DEPARTMENT_OPTIONS } from "./types"
import { Sparkles, Globe, Laptop, MapPin, Info, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step1BasicsProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step1Basics({ form }: Step1BasicsProps) {
    const { t, locale } = useTranslate()

    const jobTitle = form.watch('title')
    const description = form.watch('description')
    const location = form.watch('location')
    const employmentType = form.watch('employmentType')
    const salaryMin = form.watch('salaryMin')
    const salaryMax = form.watch('salaryMax')

    const descriptionLength = description?.length || 0
    const titleLength = jobTitle?.length || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step1.title")}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {t("jobWizard.step1.subtitle")}
                </p>
            </div>

            {/* Job Title & Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-2">
                                <FormLabel>{t("jobWizard.step1.jobTitle")} *</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{t("jobWizard.step1.jobTitleHint")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <FormControl>
                                <Input
                                    placeholder={t("jobWizard.step1.jobTitlePlaceholder")}
                                    {...field}
                                    className={cn(
                                        "transition-all",
                                        field.value && "ring-2 ring-primary/20"
                                    )}
                                />
                            </FormControl>
                            <div className="flex items-center justify-between text-xs">
                                <FormMessage />
                                <span className={cn(
                                    "text-muted-foreground",
                                    titleLength > 50 && "text-amber-500",
                                    titleLength > 80 && "text-destructive"
                                )}>
                                    {titleLength}/100
                                </span>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.department")} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("jobWizard.step1.selectDepartment")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {DEPARTMENT_OPTIONS.map((dept) => (
                                        <SelectItem key={dept.value} value={dept.value}>
                                            {locale === 'ar' ? dept.label : dept.labelEn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Employment Type & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.workType")} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="remote">{t("jobWizard.step1.remote")}</SelectItem>
                                    <SelectItem value="full-time">{t("jobs.fullTime")}</SelectItem>
                                    <SelectItem value="part-time">{t("jobs.partTime")}</SelectItem>
                                    <SelectItem value="contract">{t("jobs.contract")}</SelectItem>
                                    <SelectItem value="internship">{t("jobs.internship")}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.location")} *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t("jobWizard.step1.locationPlaceholder")}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="salaryMin"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.salaryMin")}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value ?? ''}
                                    min={0}
                                    className={cn(
                                        "transition-all",
                                        field.value && salaryMax && field.value > salaryMax && "ring-2 ring-destructive/20"
                                    )}
                                />
                            </FormControl>
                            {salaryMin && salaryMax && salaryMin > salaryMax && (
                                <p className="text-xs text-destructive">
                                    {t("jobWizard.step1.salaryError")}
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="salaryMax"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.salaryMax")}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="15000"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value ?? ''}
                                    min={salaryMin || 0}
                                    className={cn(
                                        "transition-all",
                                        field.value && salaryMin && field.value < salaryMin && "ring-2 ring-destructive/20"
                                    )}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("jobWizard.step1.currency")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {CURRENCY_OPTIONS.map((curr) => (
                                        <SelectItem key={curr.value} value={curr.value}>
                                            {locale === 'ar' ? curr.label : curr.labelEn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Job Description */}
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FormLabel>{t("jobWizard.step1.description")} *</FormLabel>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{t("jobWizard.step1.descriptionHint")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 text-primary border-primary hover:bg-primary/10 transition-all hover:scale-105"
                            >
                                <Sparkles className="h-4 w-4" />
                                {t("jobWizard.step1.generateWithAI")}
                            </Button>
                        </div>
                        <FormControl>
                            <Textarea
                                placeholder={t("jobWizard.step1.descriptionPlaceholder")}
                                rows={6}
                                {...field}
                                className={cn(
                                    "transition-all resize-none",
                                    field.value && "ring-2 ring-primary/20"
                                )}
                            />
                        </FormControl>
                        <div className="flex items-center justify-between text-xs mt-1">
                            <FormMessage />
                            <span className={cn(
                                "text-muted-foreground",
                                descriptionLength < 50 && "text-amber-500",
                                descriptionLength > 2000 && "text-destructive"
                            )}>
                                {descriptionLength}/2000
                            </span>
                        </div>
                    </FormItem>
                )}
            />

            {/* Social Preview */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/50 to-muted/20 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t("jobWizard.step1.socialPreview")}</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                    {t("jobWizard.step1.socialPreviewDesc")}
                </p>

                {/* Preview Card */}
                <div className="bg-background border rounded-lg p-4 max-w-md shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                            {jobTitle?.[0]?.toUpperCase() || 'J'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                                {jobTitle || t("jobWizard.step1.previewJobTitle")}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                                {t("jobWizard.step1.postedAgo")}
                            </p>
                            <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
                                {description || t("jobWizard.step1.previewDescription")}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                    <Laptop className="h-3 w-3" />
                                    {employmentType === 'remote' ? t("jobWizard.step1.remote") : t(`jobs.${employmentType?.replace('-', '')}`)}
                                </span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                    <MapPin className="h-3 w-3" />
                                    {location || t("jobWizard.step1.previewLocation")}
                                </span>
                                {salaryMin && salaryMax && (
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                                        {salaryMin} - {salaryMax}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

