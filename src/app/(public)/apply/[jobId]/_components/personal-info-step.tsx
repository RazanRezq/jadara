"use client"

import { useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "@/components/ui/form"
import { ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getLocalizedLanguageName } from "@/lib/language-translations"
import type { PersonalData } from "./store"

interface Job {
    id: string
    title: string
    currency?: string
    screeningQuestions: Array<{ question: string; disqualify: boolean }>
    languages: Array<{ language: string; level: string }>
    candidateDataConfig: {
        requireLinkedIn: boolean
        requirePortfolio: boolean
        hideSalaryExpectation: boolean
    }
}

interface PersonalInfoStepProps {
    job: Job
    existingData?: PersonalData | null
    onSubmit: (data: PersonalData) => Promise<void>
    onBack?: () => void
    isSubmitting?: boolean
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
            : z.record(z.string(), z.boolean()).optional(),
        languageProficiency: job.languages && job.languages.length > 0
            ? z.object(languageSchema)
            : z.record(z.string(), z.string()).optional(),
    })
}

export function PersonalInfoStep({ job, existingData, onSubmit, onBack, isSubmitting = false }: PersonalInfoStepProps) {
    const { t, locale } = useTranslate()
    const isRTL = locale === "ar"

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
        defaultValues: existingData || {
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

    // Update form when existingData changes
    useEffect(() => {
        if (existingData) {
            form.reset(existingData)
        }
    }, [existingData, form])

    const handleSubmit = async (data: PersonalData) => {
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

        await onSubmit(data)
    }

    return (
        <Card className="border-2 border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
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
                        onSubmit={form.handleSubmit(handleSubmit)}
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
                                                placeholder={t("apply.namePlaceholder")}
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
                                                placeholder={t("apply.majorPlaceholder")}
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
                                
                                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-4">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                                        {t("apply.screeningGuidance.title")}
                                    </AlertTitle>
                                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                                        {t("apply.screeningGuidance.message")}
                                    </AlertDescription>
                                </Alert>
                                
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
                                                        {getLocalizedLanguageName(lang.language, locale)}
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
                                            {job.candidateDataConfig.requireLinkedIn && "*"}
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
                                            {job.candidateDataConfig.requirePortfolio && "*"}
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

                        <div className="flex gap-3">
                            {onBack && (
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="outline"
                                    className="h-12 text-base gap-2"
                                    onClick={onBack}
                                    disabled={isSubmitting}
                                >
                                    {t("common.back")}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                size="lg"
                                className="flex-1 h-12 text-base gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="size-4" />
                                        {t("common.loading")}
                                    </>
                                ) : (
                                    <>
                                        {t("common.next")}
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}



