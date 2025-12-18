"use client"

import { useState } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    MapPin,
    Briefcase,
    Clock,
    CheckCircle2,
    Star,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Mic,
    FileText,
    Sparkles,
    ShieldAlert,
    Languages,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

interface Job {
    id: string
    title: string
    description: string
    department: string
    location: string
    employmentType: string
    currency?: string
    skills: Array<{ name: string; importance: string }>
    screeningQuestions: Array<{ question: string; disqualify: boolean }>
    languages: Array<{ language: string; level: string }>
    minExperience: number
    candidateDataConfig: {
        requireCV: boolean
        requireLinkedIn: boolean
        requirePortfolio: boolean
        hideSalaryExpectation: boolean
        hidePersonalInfo: boolean
    }
    candidateInstructions: string
    questions: Array<{
        text: string
        type: "text" | "voice"
        weight: number
        timeLimit?: string
        hideTextUntilRecording?: boolean
    }>
    retakePolicy: {
        allowRetake: boolean
        maxAttempts: number
    }
}

interface PersonalData {
    name: string
    email: string
    phone: string
    age?: number
    major?: string
    yearsOfExperience?: number
    salaryExpectation?: number
    linkedinUrl?: string
    portfolioUrl?: string
    screeningAnswers?: Record<string, boolean>
    languageProficiency?: Record<string, string>
}

interface JobLandingProps {
    job: Job
    onStartApplication: (personalData: PersonalData) => Promise<unknown>
}

const getPersonalDataSchema = (
    job: Job,
    t: (key: string) => string
) => {
    // Build screening questions schema dynamically
    const screeningSchema: Record<string, z.ZodBoolean> = {}
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
        job.screeningQuestions.forEach((sq) => {
            screeningSchema[sq.question] = z.boolean()
        })
    }

    // Build languages schema dynamically
    const languageSchema: Record<string, z.ZodString> = {}
    if (job.languages && job.languages.length > 0) {
        job.languages.forEach((lang) => {
            languageSchema[lang.language] = z.string().min(1, t("apply.validation.languageRequired"))
        })
    }

    return z.object({
        name: z.string().min(2, t("apply.validation.nameMin")),
        email: z.string().email(t("apply.validation.emailInvalid")),
        phone: z.string().min(6, t("apply.validation.phoneMin")),
        age: z.union([
            z.coerce
                .number()
                .min(16, t("apply.validation.ageMin"))
                .max(100, t("apply.validation.ageMax")),
            z.literal(""),
        ]).optional(),
        major: z.string().optional(),
        yearsOfExperience: z.union([
            z.coerce
                .number()
                .min(0, t("apply.validation.experienceMin"))
                .max(50, t("apply.validation.experienceMax")),
            z.literal(""),
        ]).optional(),
        salaryExpectation: !job.candidateDataConfig.hideSalaryExpectation
            ? z.coerce.number().min(0, t("apply.validation.salaryMin"))
            : z.union([
                z.coerce.number().min(0, t("apply.validation.salaryMin")),
                z.literal(""),
            ]).optional(),
        linkedinUrl: job.candidateDataConfig.requireLinkedIn
            ? z.string().url(t("apply.validation.linkedinRequired"))
            : z.string().url(t("apply.validation.urlInvalid")).optional().or(z.literal("")),
        portfolioUrl: job.candidateDataConfig.requirePortfolio
            ? z.string().url(t("apply.validation.portfolioRequired"))
            : z.string().url(t("apply.validation.urlInvalid")).optional().or(z.literal("")),
        screeningAnswers: job.screeningQuestions && job.screeningQuestions.length > 0
            ? z.object(screeningSchema)
            : z.record(z.boolean()).optional(),
        languageProficiency: job.languages && job.languages.length > 0
            ? z.object(languageSchema)
            : z.record(z.string()).optional(),
    })
}

export function JobLanding({ job, onStartApplication }: JobLandingProps) {
    const { t, locale } = useTranslate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const personalDataSchema = getPersonalDataSchema(job, t)

    // Build default screening answers
    const defaultScreeningAnswers: Record<string, boolean> = {}
    const screeningQuestions = Array.isArray(job.screeningQuestions) ? job.screeningQuestions : []
    if (screeningQuestions.length > 0) {
        screeningQuestions.forEach((sq) => {
            defaultScreeningAnswers[sq.question] = false
        })
    }

    // Build default language proficiency
    const defaultLanguageProficiency: Record<string, string> = {}
    const languages = Array.isArray(job.languages) ? job.languages : []
    if (languages.length > 0) {
        languages.forEach((lang) => {
            defaultLanguageProficiency[lang.language] = ""
        })
    }

    const form = useForm<PersonalData>({
        resolver: zodResolver(personalDataSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            age: undefined,
            major: "",
            yearsOfExperience: undefined,
            salaryExpectation: undefined,
            linkedinUrl: "",
            portfolioUrl: "",
            screeningAnswers: defaultScreeningAnswers,
            languageProficiency: defaultLanguageProficiency,
        },
    })

    const onSubmit = async (data: PersonalData) => {
        // Knockout validation - check if any disqualifying question was answered "No"
        if (job.screeningQuestions && job.screeningQuestions.length > 0 && data.screeningAnswers) {
            for (const sq of job.screeningQuestions) {
                if (sq.disqualify && data.screeningAnswers[sq.question] === false) {
                    toast.error(t("apply.knockoutMessage"), {
                        duration: 6000,
                    })
                    return // Stop submission
                }
            }
        }

        setIsSubmitting(true)
        try {
            await onStartApplication(data)
            // No success toast here - user is just moving to next step
            // Success feedback will be shown on final submission
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : t("common.error")
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const textQuestions = job.questions.filter((q) => q.type === "text").length
    const voiceQuestions = job.questions.filter((q) => q.type === "voice").length

    const employmentTypeLabel: Record<string, string> = {
        "full-time": t("jobs.fullTime"),
        "part-time": t("jobs.partTime"),
        contract: t("jobs.contract"),
        internship: t("jobs.internship"),
        remote: t("apply.remote"),
    }

    const isRTL = locale === "ar"
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Sparkles className="size-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">SmartRecruit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    {/* Job Header */}
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Badge
                            variant="secondary"
                            className="mb-4 px-4 py-1.5 text-sm font-medium"
                        >
                            {job.department || t("apply.openPosition")}
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {job.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
                            {job.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    <span>{job.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="size-4" />
                                <span>
                                    {employmentTypeLabel[job.employmentType] ||
                                        job.employmentType}
                                </span>
                            </div>
                            {job.minExperience > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="size-4" />
                                    <span>
                                        {job.minExperience}+ {t("applicants.years")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!showForm ? (
                        /* Job Details View */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            {/* Description Card */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="size-5 text-primary" />
                                        {t("apply.aboutRole")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <article
                                        className={cn(
                                            "prose max-w-none",
                                            isRTL && "text-right"
                                        )}
                                        dir={isRTL ? "rtl" : "ltr"}
                                    >
                                        <ReactMarkdown>{job.description}</ReactMarkdown>
                                    </article>
                                </CardContent>
                            </Card>

                            {/* Skills */}
                            {job.skills.length > 0 && (
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Star className="size-5 text-primary" />
                                            {t("apply.requiredSkills")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.map((skill, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant={
                                                        skill.importance === "required"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className="px-3 py-1"
                                                >
                                                    {skill.importance === "required" && (
                                                        <CheckCircle2 className="size-3 mr-1" />
                                                    )}
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Assessment Info */}
                            <Card className="border-primary/30 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Mic className="size-5 text-primary" />
                                        {t("apply.assessmentInfo")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground">
                                        {t("apply.assessmentDescription")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {textQuestions > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="size-8 rounded-lg bg-secondary flex items-center justify-center">
                                                    <FileText className="size-4" />
                                                </div>
                                                <span>
                                                    {textQuestions} {t("apply.textQuestions")}
                                                </span>
                                            </div>
                                        )}
                                        {voiceQuestions > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="size-8 rounded-lg bg-secondary flex items-center justify-center">
                                                    <Mic className="size-4" />
                                                </div>
                                                <span>
                                                    {voiceQuestions} {t("apply.voiceQuestions")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {voiceQuestions > 0 && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                                {t("apply.voiceWarning")}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Start Button */}
                            <div className="flex justify-center pt-4">
                                <Button
                                    size="lg"
                                    onClick={() => setShowForm(true)}
                                    className="min-w-[200px] h-12 text-base gap-2 group"
                                >
                                    {t("apply.startApplication")}
                                    <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Personal Information Form */
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowForm(false)}
                                        className="gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {isRTL ? (
                                            <ArrowRight className="size-4" />
                                        ) : (
                                            <ArrowLeft className="size-4" />
                                        )}
                                        {t("common.back")}
                                    </Button>
                                </div>
                                <CardTitle className="text-xl">
                                    {t("apply.personalInfo")}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    {t("apply.personalInfoDescription")}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-5"
                                        noValidate
                                    >
                                        {/* Basic Info */}
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("common.name")} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t(
                                                                    "apply.namePlaceholder"
                                                                )}
                                                                dir={locale === "ar" ? "rtl" : "ltr"}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("common.email")} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="example@email.com"
                                                                dir="ltr"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("applicants.phone")} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="+966 5XX XXX XXXX"
                                                                dir="ltr"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="age"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("applicants.age")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={16}
                                                                max={100}
                                                                placeholder="25"
                                                                dir="ltr"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="major"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("applicants.major")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t(
                                                                    "apply.majorPlaceholder"
                                                                )}
                                                                dir={locale === "ar" ? "rtl" : "ltr"}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="yearsOfExperience"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("apply.yearsOfExperience")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={50}
                                                                placeholder="5"
                                                                dir="ltr"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {!job.candidateDataConfig.hideSalaryExpectation && (
                                                <FormField
                                                    control={form.control}
                                                    name="salaryExpectation"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                {t("applicants.salaryExpectation")}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <CurrencyInput
                                                                    currency={job.currency || "SAR"}
                                                                    currencyPosition="suffix"
                                                                    min={0}
                                                                    placeholder="10000"
                                                                    dir="ltr"
                                                                    {...field}
                                                                    value={field.value || ""}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>

                                        {/* Screening Questions */}
                                        {Array.isArray(job.screeningQuestions) && job.screeningQuestions.length > 0 && (
                                            <>
                                                <Separator className="my-4" />
                                                <div className="space-y-3">
                                                    {job.screeningQuestions.map((sq, index) => (
                                                        <FormField
                                                            key={index}
                                                            control={form.control}
                                                            name={`screeningAnswers.${sq.question}` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="flex items-center justify-between gap-2 text-sm">
                                                                        <span>
                                                                            {index + 1}. {sq.question}
                                                                        </span>
                                                                        {sq.disqualify && (
                                                                            <Badge variant="destructive" className="text-xs shrink-0">
                                                                                {t("apply.disqualifyWarning")}
                                                                            </Badge>
                                                                        )}
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <RadioGroup
                                                                            onValueChange={(value) => {
                                                                                const boolValue = value === "true"
                                                                                field.onChange(boolValue)
                                                                            }}
                                                                            value={field.value === undefined || field.value === null ? "" : String(field.value)}
                                                                            dir={isRTL ? "rtl" : "ltr"}
                                                                            className="flex gap-6 mt-2"
                                                                        >
                                                                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                                                <RadioGroupItem value="true" id={`sq-${index}-yes`} />
                                                                                <label
                                                                                    htmlFor={`sq-${index}-yes`}
                                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                                >
                                                                                    {t("common.yes")}
                                                                                </label>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                                                <RadioGroupItem value="false" id={`sq-${index}-no`} />
                                                                                <label
                                                                                    htmlFor={`sq-${index}-no`}
                                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                                >
                                                                                    {t("common.no")}
                                                                                </label>
                                                                            </div>
                                                                        </RadioGroup>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Languages */}
                                        {Array.isArray(job.languages) && job.languages.length > 0 && (
                                            <>
                                                <Separator className="my-4" />
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    {job.languages.map((lang, index) => (
                                                        <FormField
                                                            key={index}
                                                            control={form.control}
                                                            name={`languageProficiency.${lang.language}` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm">
                                                                        {lang.language}
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Select 
                                                                            onValueChange={field.onChange} 
                                                                            value={field.value}
                                                                            dir={isRTL ? "rtl" : "ltr"}
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder={t("apply.languageProficiency")} />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="beginner">{t("apply.beginner")}</SelectItem>
                                                                                <SelectItem value="intermediate">{t("apply.intermediate")}</SelectItem>
                                                                                <SelectItem value="advanced">{t("apply.advanced")}</SelectItem>
                                                                                <SelectItem value="native">{t("apply.native")}</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Links */}
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <FormField
                                                control={form.control}
                                                name="linkedinUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            LinkedIn{" "}
                                                            {job.candidateDataConfig.requireLinkedIn &&
                                                                "*"}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://linkedin.com/in/..."
                                                                dir="ltr"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="portfolioUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("apply.portfolio")}{" "}
                                                            {job.candidateDataConfig.requirePortfolio &&
                                                                "*"}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://portfolio.com/..."
                                                                dir="ltr"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full h-12 text-base gap-2"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner className="size-4" />
                                                    {t("common.loading")}
                                                </>
                                            ) : (
                                                <>
                                                    {t("apply.continueToAssessment")}
                                                    <ArrowIcon className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    )
}

