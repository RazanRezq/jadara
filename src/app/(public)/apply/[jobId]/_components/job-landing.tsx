"use client"

import { useTranslate } from "@/hooks/useTranslate"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    questions: Array<{
        text: string
        type: "text" | "voice"
        weight: number
        timeLimit?: string
        hideTextUntilRecording?: boolean
    }>
}

interface JobLandingProps {
    job: Job
    onStartApplication: () => void
}

export function JobLanding({ job, onStartApplication }: JobLandingProps) {
    const { t, locale } = useTranslate()

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

                    {/* Job Details View */}
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
                                    className="prose max-w-none text-start"
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
                                                    <CheckCircle2 className="size-3 me-1" />
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
                                onClick={onStartApplication}
                                className="min-w-[200px] h-12 text-base gap-2 group"
                            >
                                {t("apply.startApplication")}
                                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

