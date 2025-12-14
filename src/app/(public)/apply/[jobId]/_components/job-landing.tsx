"use client"

import { useState } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
    skills: Array<{ name: string; importance: string }>
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
}

interface JobLandingProps {
    job: Job
    onStartApplication: (personalData: PersonalData) => Promise<unknown>
}

const getPersonalDataSchema = (
    job: Job,
    t: (key: string) => string
) => {
    let schema = z.object({
        name: z.string().min(2, t("apply.validation.nameMin")),
        email: z.string().email(t("apply.validation.emailInvalid")),
        phone: z.string().min(6, t("apply.validation.phoneMin")),
        age: z.coerce.number().min(16).max(100).optional(),
        major: z.string().optional(),
        yearsOfExperience: z.coerce.number().min(0).max(50).optional(),
        salaryExpectation: z.coerce.number().min(0).optional(),
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        portfolioUrl: z.string().url().optional().or(z.literal("")),
    })

    if (job.candidateDataConfig.requireLinkedIn) {
        schema = schema.extend({
            linkedinUrl: z.string().url(t("apply.validation.linkedinRequired")),
        })
    }

    if (job.candidateDataConfig.requirePortfolio) {
        schema = schema.extend({
            portfolioUrl: z.string().url(t("apply.validation.portfolioRequired")),
        })
    }

    return schema
}

export function JobLanding({ job, onStartApplication }: JobLandingProps) {
    const { t, locale } = useTranslate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const personalDataSchema = getPersonalDataSchema(job, t)
    type PersonalDataForm = z.infer<typeof personalDataSchema>

    const form = useForm<PersonalDataForm>({
        resolver: zodResolver(personalDataSchema),
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
        },
    })

    const onSubmit = async (data: PersonalDataForm) => {
        setIsSubmitting(true)
        try {
            await onStartApplication(data as PersonalData)
            toast.success(t("apply.applicationStarted"))
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
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {job.description}
                                    </p>
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
                                        className="space-y-6"
                                    >
                                        {/* Basic Info */}
                                        <div className="grid md:grid-cols-2 gap-4">
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
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
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
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
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
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    placeholder="10000"
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

                                        {/* Links */}
                                        <div className="grid md:grid-cols-2 gap-4">
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
                                                                placeholder="https://behance.net/..."
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

