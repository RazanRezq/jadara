"use client"

import { useState } from "react"
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
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, CURRENCY_OPTIONS, DEPARTMENT_OPTIONS } from "./types"
import {
    Sparkles,
    Globe,
    Laptop,
    MapPin,
    HelpCircle,
    Briefcase,
    Building2,
    DollarSign,
    FileText,
    Clock,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextSelectorModal } from "./context-selector-modal"

interface Step1BasicsProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step1Basics({ form }: Step1BasicsProps) {
    const { t, locale } = useTranslate()
    const [contextModalOpen, setContextModalOpen] = useState(false)

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
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
                    <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t("jobWizard.step1.title")}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {t("jobWizard.step1.subtitle")}
                </p>
            </div>

            {/* Basic Information Card */}
            <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{t("jobWizard.step1.sectionBasicInfo")}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{t("jobWizard.step1.sectionBasicInfoDesc")}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        {/* Job Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium flex items-center gap-1.5 min-h-[20px]">
                                        {t("jobWizard.step1.jobTitle")}
                                        <span className="text-destructive">*</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs text-sm">{t("jobWizard.step1.jobTitleHint")}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("jobWizard.step1.jobTitlePlaceholder")}
                                            {...field}
                                            maxLength={100}
                                            className={cn(
                                                "transition-all h-11",
                                                field.value && "ring-2 ring-primary/20 border-primary/30"
                                            )}
                                        />
                                    </FormControl>
                                    <div className="flex items-center justify-between gap-3 pt-1">
                                        <FormMessage className="text-xs flex-1" />
                                        <span className={cn(
                                            "text-xs font-medium leading-none",
                                            titleLength < 30 && "text-muted-foreground",
                                            titleLength >= 30 && titleLength < 80 && "text-emerald-600 dark:text-emerald-500",
                                            titleLength >= 80 && "text-destructive"
                                        )}>
                                            {titleLength}/100
                                        </span>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Department */}
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">
                                        {t("jobWizard.step1.department")} <span className="text-destructive ms-1">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Combobox
                                            options={[...DEPARTMENT_OPTIONS]}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder={t("jobWizard.step1.selectDepartment")}
                                            searchPlaceholder={locale === 'ar' ? 'ابحث أو اكتب قسم جديد...' : 'Search or type a new department...'}
                                            emptyText={locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                                            allowCustom={true}
                                            locale={locale}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Work Details Card */}
            <Card className="border-2 border-purple-500/10 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{t("jobWizard.step1.sectionWorkDetails")}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{t("jobWizard.step1.sectionWorkDetailsDesc")}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        {/* Employment Type */}
                        <FormField
                            control={form.control}
                            name="employmentType"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">
                                        {t("jobWizard.step1.workType")} <span className="text-destructive ms-1">*</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
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
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Location */}
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">
                                        {t("jobWizard.step1.location")} <span className="text-destructive ms-1">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("jobWizard.step1.locationPlaceholder")}
                                            {...field}
                                            className="h-11"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Salary Card */}
            <Card className="border-2 border-emerald-500/10 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{t("jobWizard.step1.sectionCompensation")}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("jobWizard.step1.sectionCompensationDesc")}</p>
                            </div>
                        </div>
                        {salaryMin && salaryMax && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                {salaryMin.toLocaleString()} - {salaryMax.toLocaleString()}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        {/* Minimum Salary */}
                        <FormField
                            control={form.control}
                            name="salaryMin"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">{t("jobWizard.step1.salaryMin")}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                type="number"
                                                placeholder="5000"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                value={field.value ?? ''}
                                                min={0}
                                                className={cn(
                                                    "ps-9 h-11 transition-all",
                                                    field.value && salaryMax && field.value > salaryMax && "ring-2 ring-destructive/30 border-destructive/30"
                                                )}
                                            />
                                        </div>
                                    </FormControl>
                                    {salaryMin && salaryMax && salaryMin > salaryMax && (
                                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                            <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                            {t("jobWizard.step1.salaryError")}
                                        </p>
                                    )}
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Maximum Salary */}
                        <FormField
                            control={form.control}
                            name="salaryMax"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">{t("jobWizard.step1.salaryMax")}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                type="number"
                                                placeholder="15000"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                value={field.value ?? ''}
                                                min={salaryMin || 0}
                                                className={cn(
                                                    "ps-9 h-11 transition-all",
                                                    field.value && salaryMin && field.value < salaryMin && "ring-2 ring-destructive/30 border-destructive/30"
                                                )}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Currency */}
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium min-h-[20px] flex items-center">{t("jobWizard.step1.currency")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
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
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Job Description Card */}
            <Card className="border-2 border-amber-500/10 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {t("jobWizard.step1.description")} <span className="text-destructive text-base">*</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-sm">{t("jobWizard.step1.descriptionHint")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("jobWizard.step1.sectionDescription")}</p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className={cn(
                                "gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                                "transition-all hover:scale-105 shadow-lg hover:shadow-xl",
                                (!jobTitle || !employmentType || !location) && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => setContextModalOpen(true)}
                            disabled={!jobTitle || !employmentType || !location}
                        >
                            <Sparkles className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("jobWizard.step1.generateWithAI")}</span>
                            <span className="sm:hidden">AI</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormControl>
                                    <Textarea
                                        placeholder={t("jobWizard.step1.descriptionPlaceholder")}
                                        rows={8}
                                        {...field}
                                        maxLength={2000}
                                        className={cn(
                                            "transition-all resize-none leading-relaxed",
                                            field.value && "ring-2 ring-primary/20 border-primary/30"
                                        )}
                                    />
                                </FormControl>
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <FormMessage className="text-xs flex-1" />
                                    <span className={cn(
                                        "text-xs font-medium leading-none",
                                        descriptionLength < 50 && "text-muted-foreground",
                                        descriptionLength >= 50 && descriptionLength < 1800 && "text-emerald-600 dark:text-emerald-500",
                                        descriptionLength >= 1800 && "text-destructive"
                                    )}>
                                        {descriptionLength}/2000
                                    </span>
                                </div>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Social Preview Card */}
            <Card className="border-2 border-indigo-500/10 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{t("jobWizard.step1.socialPreview")}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {t("jobWizard.step1.socialPreviewDesc")}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Preview Card */}
                    <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-primary/10 rounded-xl p-5 max-w-xl mx-auto shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center text-white font-bold shrink-0 shadow-md ring-2 ring-primary/20">
                                {jobTitle?.[0]?.toUpperCase() || <Briefcase className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg truncate">
                                    {jobTitle || t("jobWizard.step1.previewJobTitle")}
                                </h4>
                                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {t("jobWizard.step1.postedAgo")}
                                </p>
                                <p className="text-sm mt-3 line-clamp-3 text-foreground/80 leading-relaxed">
                                    {description || t("jobWizard.step1.previewDescription")}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Badge variant="secondary" className="gap-1.5 py-1 px-3">
                                        <Laptop className="h-3.5 w-3.5" />
                                        {employmentType === 'remote' ? t("jobWizard.step1.remote") : t(`jobs.${employmentType?.replace('-', '')}`)}
                                    </Badge>
                                    <Badge variant="secondary" className="gap-1.5 py-1 px-3">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {location || t("jobWizard.step1.previewLocation")}
                                    </Badge>
                                    {salaryMin && salaryMax && (
                                        <Badge className="gap-1.5 py-1 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 border-0">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {salaryMin.toLocaleString()} - {salaryMax.toLocaleString()}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Context Selector Modal */}
            <ContextSelectorModal
                open={contextModalOpen}
                onOpenChange={setContextModalOpen}
                jobTitle={jobTitle || ''}
                employmentType={employmentType}
                workPlace={location || ''}
                onDescriptionGenerated={(description) => {
                    form.setValue('description', description)
                }}
            />
        </div>
    )
}

