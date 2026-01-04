"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Sparkles, Calendar, Trophy, Star, TrendingUp, CheckCircle, Zap } from "lucide-react"
import { IBM_Plex_Sans_Arabic } from "next/font/google"
import type { Applicant, EvaluationData } from "./types"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
})

interface AIRecommendedSectionProps {
    applicants: Applicant[]
    evaluations?: Map<string, EvaluationData>
    onApplicantClick: (applicant: Applicant) => void
}

export function AIRecommendedSection({ applicants, evaluations, onApplicantClick }: AIRecommendedSectionProps) {
    const { t, isRTL, locale } = useTranslate()

    // Get evaluation for an applicant
    const getEvaluation = (applicantId: string) => evaluations?.get(applicantId)

    // Calculate intelligent ranking score (not just AI score)
    const calculateIntelligentScore = (applicant: Applicant) => {
        const baseScore = applicant.aiScore || 0
        const evaluation = getEvaluation(applicant.id)

        let bonusPoints = 0

        // Bonus for "hire" recommendation
        if (evaluation?.recommendation === 'hire') {
            bonusPoints += 5
        }

        // Bonus for high voice relevance (if available)
        const voiceAnalysis = evaluation?.aiAnalysisBreakdown?.voiceResponsesAnalysis
        if (voiceAnalysis?.averageRelevanceScore && voiceAnalysis.averageRelevanceScore >= 80) {
            bonusPoints += 3
        }

        // Bonus for high text relevance (if available)
        const textAnalysis = evaluation?.aiAnalysisBreakdown?.textResponsesAnalysis
        if (textAnalysis?.averageRelevanceScore && textAnalysis.averageRelevanceScore >= 80) {
            bonusPoints += 3
        }

        // Penalty for red flags
        if (evaluation?.redFlags?.en && evaluation.redFlags.en.length > 0) {
            bonusPoints -= evaluation.redFlags.en.length * 2
        }

        // Bonus for passing all screening questions
        const screeningAnalysis = evaluation?.aiAnalysisBreakdown?.screeningQuestionsAnalysis
        if (screeningAnalysis && screeningAnalysis.failedKnockouts.length === 0) {
            bonusPoints += 2
        }

        return Math.max(0, Math.min(100, baseScore + bonusPoints))
    }

    // Filter applicants with score >= 70, "hire" recommendation, and sort by intelligent score
    const topApplicants = applicants
        .filter(app => {
            const evaluation = getEvaluation(app.id)
            return (
                app.aiScore !== undefined &&
                app.aiScore !== null &&
                app.aiScore >= 70 &&
                evaluation?.recommendation === 'hire'
            )
        })
        .map(app => ({
            ...app,
            intelligentScore: calculateIntelligentScore(app),
            isExceptional: (app.aiScore || 0) >= 90,
            isTopCandidate: (app.aiScore || 0) >= 80,
        }))
        .sort((a, b) => b.intelligentScore - a.intelligentScore)
        .slice(0, 5)

    // Don't render if we don't have candidates
    if (topApplicants.length === 0) {
        return null
    }

    // Count exceptional candidates (90%+)
    const exceptionalCount = topApplicants.filter(a => a.isExceptional).length


    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return t("common.today")
        if (diffDays === 1) return t("common.yesterday")
        if (diffDays < 7) return `${diffDays}${t("common.daysAgo")}`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}${t("common.weeksAgo")}`
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
    }

    // Get status badge config
    const getStatusBadge = (status: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            // New applicants - Purple/Violet (fresh, needs attention)
            new: { label: t("applicants.status.new"), className: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium" },

            // Pending evaluation - Amber/Yellow (waiting, in-progress)
            pending: { label: t("applicants.status.pending"), className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-medium" },

            // Evaluated - Blue (processed, reviewed)
            evaluated: { label: t("applicants.status.evaluated"), className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium" },

            // Interview scheduled - Indigo (next step, important)
            interview: { label: t("applicants.status.interview"), className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium" },

            // Hired - Green (success, positive outcome)
            hired: { label: t("applicants.status.hired"), className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium" },

            // Rejected - Red (negative outcome)
            rejected: { label: t("applicants.status.rejected"), className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-medium" },

            // Failed - Red with higher contrast (error state)
            failed: { label: t("applicants.status.failed"), className: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 font-medium" },

            // Archived - Gray (inactive, stored)
            archived: { label: t("applicants.status.archived"), className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 font-medium" },

            // Withdrawn - Gray (applicant withdrew)
            withdrawn: { label: t("applicants.status.withdrawn"), className: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 font-medium" },
        }
        return configs[status] || { label: status, className: "bg-muted text-muted-foreground font-medium" }
    }

    // Get top strength for a candidate
    const getTopStrength = (applicantId: string): string | null => {
        const evaluation = getEvaluation(applicantId)
        const strengths = locale === 'ar'
            ? evaluation?.strengths?.ar
            : evaluation?.strengths?.en
        return strengths && strengths.length > 0 ? strengths[0] : null
    }

    // Get recommendation badge
    const getRecommendationBadge = (applicantId: string) => {
        const evaluation = getEvaluation(applicantId)
        if (!evaluation?.recommendation) return null

        const configs: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
            hire: {
                label: locale === 'ar' ? 'توظيف' : 'Hire',
                className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                icon: CheckCircle
            },
            hold: {
                label: locale === 'ar' ? 'انتظار' : 'Hold',
                className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                icon: TrendingUp
            },
            reject: {
                label: locale === 'ar' ? 'رفض' : 'Reject',
                className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                icon: TrendingUp
            },
        }
        return configs[evaluation.recommendation]
    }

    return (
        <div className={cn("space-y-6 pb-6 mt-10", ibmPlexArabic.className)} dir={isRTL ? "rtl" : "ltr"}>
            {/* Section Header - Enhanced with exceptional count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Sparkles className="h-7 w-7 text-foreground" />
                        {exceptionalCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {exceptionalCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            {t("applicants.aiRecommendedTitle")}
                            {exceptionalCount > 0 && (
                                <Badge className="bg-primary text-white text-[10px] font-semibold px-2 py-0.5">
                                    <Trophy className="w-3 h-3 me-1" />
                                    {exceptionalCount} {locale === 'ar' ? 'مرشح استثنائي' : 'Exceptional'}
                                </Badge>
                            )}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {locale === 'ar'
                                ? 'أفضل المرشحين مصنفين بذكاء اصطناعي متقدم'
                                : 'Top candidates ranked by intelligent AI scoring'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className={cn(
                "grid gap-6",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
                {topApplicants.map((applicant, index) => {
                    const score = applicant.aiScore || 0
                    const name = applicant.displayName || applicant.personalData?.name || "Unnamed"
                    const topStrength = getTopStrength(applicant.id)
                    const recBadge = getRecommendationBadge(applicant.id)

                    // Determine score color based on threshold - unified to primary + amber
                    const scoreColorClass = score >= 80
                        ? "stroke-primary"
                        : "stroke-amber-500"

                    const scoreBgClass = score >= 80
                        ? "bg-primary/5 border-primary/20"
                        : "bg-amber-500/5 border-amber-500/20"

                    return (
                        <div key={applicant.id} className="relative group">
                            {/* Enhanced glow for exceptional candidates - subtle in light mode, prominent in dark mode */}
                            <div className={cn(
                                "absolute -inset-[2px] rounded-xl transition-all duration-300",
                                // Light mode: subtle shadow-based glow
                                "blur-[4px] opacity-40",
                                // Dark mode: stronger blur glow
                                "dark:blur-[6px] dark:opacity-100",
                                // Hover enhancement
                                "group-hover:opacity-60 dark:group-hover:opacity-100",
                                // Unified primary color glow
                                "bg-primary/20 dark:bg-primary/30"
                            )} />
                            <Card
                                dir={isRTL ? "rtl" : "ltr"}
                                className={cn(
                                    "relative cursor-pointer h-full rounded-xl transition-all hover:scale-[1.02]",
                                    // Light mode: visible border and shadow for definition
                                    "border shadow-md hover:shadow-lg",
                                    "border-gray-200 bg-white",
                                    // Dark mode: subtle border, rely on glow effect
                                    "dark:border-border/30 dark:shadow-none dark:bg-card",
                                    // Unified primary color for all top candidates
                                    (applicant.isExceptional || applicant.isTopCandidate)
                                        ? "border-primary/30 bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/5 dark:border-primary/30"
                                        : ""
                                )}
                                onClick={() => onApplicantClick(applicant)}
                            >
                            <div className="p-5 flex flex-col h-full min-h-[380px]">
                                {/* Rank badge + Status + Exceptional indicator */}
                                <div className={cn(
                                    "flex items-center justify-between mb-4",
                                    isRTL ? "flex-row-reverse" : ""
                                )}>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                            index === 0
                                                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                                : index === 1
                                                ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                                                : index === 2
                                                ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </span>
                                        {applicant.isExceptional && (
                                            <Badge className="bg-primary text-white text-[9px] px-1.5 py-0">
                                                <Zap className="w-2.5 h-2.5 me-0.5" />
                                                {locale === 'ar' ? 'استثنائي' : 'Top'}
                                            </Badge>
                                        )}
                                    </div>
                                    {recBadge && (
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-[10px] font-medium", recBadge.className)}
                                        >
                                            <recBadge.icon className="w-3 h-3 me-1" />
                                            {recBadge.label}
                                        </Badge>
                                    )}
                                </div>

                                {/* Avatar with circular score - colored by threshold */}
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <svg className="w-24 h-24 -rotate-90">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="42"
                                                strokeWidth="4"
                                                fill="none"
                                                className="stroke-muted"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="42"
                                                strokeWidth="5"
                                                fill="none"
                                                strokeLinecap="round"
                                                className={scoreColorClass}
                                                strokeDasharray={2 * Math.PI * 42}
                                                strokeDashoffset={(2 * Math.PI * 42) - (score / 100) * (2 * Math.PI * 42)}
                                            />
                                        </svg>
                                        <div className={cn(
                                            "absolute inset-2 rounded-full flex items-center justify-center font-semibold text-xl border",
                                            scoreBgClass
                                        )}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* Score - prominent display with color */}
                                <div className="text-center mb-3">
                                    <div className="flex items-baseline justify-center gap-0.5">
                                        <span className={cn(
                                            "text-3xl font-bold",
                                            score >= 80 ? "text-primary" : "text-amber-600 dark:text-amber-400"
                                        )}>
                                            {score}
                                        </span>
                                        <span className="text-lg font-medium text-muted-foreground">%</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("applicants.matchScore")}
                                    </span>
                                </div>

                                {/* Name & Job */}
                                <div className="text-center mb-3">
                                    <h3 className="font-semibold text-sm text-foreground truncate mb-0.5">
                                        {name}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {applicant.jobId?.title || t("applicants.noJob")}
                                    </p>
                                </div>

                                {/* Top Strength (from AI evaluation) */}
                                {topStrength && (
                                    <div className="mb-3 px-2">
                                        <div className="flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-foreground line-clamp-2 leading-tight text-start">
                                                {topStrength}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Status badge */}
                                <div className="flex justify-center mb-3">
                                    {(() => {
                                        const statusConfig = getStatusBadge(applicant.status)
                                        return (
                                            <Badge
                                                variant="secondary"
                                                className={cn("text-[10px] font-medium", statusConfig.className)}
                                            >
                                                {statusConfig.label}
                                            </Badge>
                                        )
                                    })()}
                                </div>

                                {/* Meta info - bottom section */}
                                <div className={cn(
                                    "flex items-center justify-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/30 mt-auto",
                                    isRTL ? "flex-row-reverse" : ""
                                )}>
                                    {applicant.personalData?.yearsOfExperience !== undefined && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-foreground">{applicant.personalData.yearsOfExperience}</span>
                                            <span>{t("common.yearsShort")}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(applicant.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
