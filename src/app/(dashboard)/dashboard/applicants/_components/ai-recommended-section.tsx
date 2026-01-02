"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Star, Briefcase, Calendar, GraduationCap, Clock } from "lucide-react"
import { IBM_Plex_Sans_Arabic } from "next/font/google"
import type { Applicant } from "./types"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
})

interface AIRecommendedSectionProps {
    applicants: Applicant[]
    onApplicantClick: (applicant: Applicant) => void
}

export function AIRecommendedSection({ applicants, onApplicantClick }: AIRecommendedSectionProps) {
    const { t, isRTL, locale } = useTranslate()

    // Filter and sort top 5 applicants by AI score
    const topApplicants = applicants
        .filter(app => app.aiScore !== undefined && app.aiScore !== null)
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 5)

    // Don't render if we don't have 5 candidates
    if (topApplicants.length === 0) {
        return null
    }

    // Avatar gradient colors
    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-500 to-purple-600",
            "from-blue-500 to-cyan-600",
            "from-emerald-500 to-teal-600",
            "from-orange-500 to-amber-600",
            "from-pink-500 to-rose-600",
        ]
        const index = (name?.charCodeAt(0) || 0) % gradients.length
        return gradients[index]
    }

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-emerald-500"
        if (score >= 70) return "text-blue-500"
        if (score >= 50) return "text-purple-500"
        return "text-gray-500"
    }

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
            new: { label: t("applicants.status.new"), className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
            pending: { label: t("applicants.status.pending"), className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
            evaluated: { label: t("applicants.status.evaluated"), className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
            interview: { label: t("applicants.status.interview"), className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
            hired: { label: t("applicants.status.hired"), className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
            rejected: { label: t("applicants.status.rejected"), className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
        }
        return configs[status] || { label: status, className: "bg-gray-100 text-gray-700" }
    }

    return (
        <div className={cn("space-y-6 pb-6", ibmPlexArabic.className)} dir={isRTL ? "rtl" : "ltr"}>
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                    {t("applicants.aiRecommendedTitle")}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>Top {topApplicants.length}</span>
                </div>
            </div>

            {/* Cards Grid - Horizontal Layout (5 columns) */}
            <div className={cn(
                "grid gap-4",
                // Responsive: 1 column on mobile, 2 on sm, 3 on md, 5 on lg+
                "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            )}>
                {topApplicants.map((applicant, index) => {
                    const score = applicant.aiScore || 0
                    const name = applicant.displayName || applicant.personalData?.name || "Unnamed"

                    // Get gradient colors based on index
                    const getGradientColors = (index: number) => {
                        const gradients = [
                            "from-violet-500/30 via-purple-500/20 to-pink-500/30",
                            "from-blue-500/30 via-cyan-500/20 to-teal-500/30",
                            "from-emerald-500/30 via-green-500/20 to-lime-500/30",
                            "from-indigo-500/30 via-blue-500/20 to-cyan-500/30",
                            "from-pink-500/30 via-rose-500/20 to-fuchsia-500/30",
                        ]
                        return gradients[index % gradients.length]
                    }

                    return (
                        <div key={applicant.id} className="group relative">
                            {/* Gradient blur background orb */}
                            <div className={cn(
                                "absolute -inset-4 rounded-full bg-gradient-to-br blur-3xl -z-10",
                                "opacity-40 group-hover:opacity-60 transition-opacity duration-500",
                                getGradientColors(index)
                            )} />

                            <Card
                                dir={isRTL ? "rtl" : "ltr"}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 h-full relative",
                                    "hover:shadow-xl hover:-translate-y-1",
                                    "glass overflow-hidden"
                                )}
                                onClick={() => onApplicantClick(applicant)}
                            >
                                <CardContent className="p-5 space-y-4">
                                {/* Header: Rank & Status */}
                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-bold px-2.5 py-0.5",
                                            index === 0 ? "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" :
                                            index === 1 ? "border-gray-400 text-gray-600 bg-gray-50 dark:bg-gray-950/30" :
                                            index === 2 ? "border-rose-600 text-rose-600 bg-rose-50 dark:bg-rose-950/30" :
                                            "border-border"
                                        )}
                                    >
                                        #{index + 1}
                                    </Badge>
                                    {(() => {
                                        const statusConfig = getStatusBadge(applicant.status)
                                        return (
                                            <Badge
                                                variant="secondary"
                                                className={cn("text-[10px] px-2 py-0.5", statusConfig.className)}
                                            >
                                                {statusConfig.label}
                                            </Badge>
                                        )
                                    })()}
                                </div>

                                {/* Avatar - themed */}
                                <div className="flex justify-center py-1">
                                    <div className="relative">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xl shadow-md">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Online indicator */}
                                        <div className={cn(
                                            "absolute bottom-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card",
                                            isRTL ? "left-0" : "right-0"
                                        )} />
                                    </div>
                                </div>

                                {/* Name & Job */}
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold text-sm leading-tight truncate px-2">
                                        {name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate px-2">
                                        {applicant.jobId?.title || t("applicants.noJob")}
                                    </p>
                                </div>

                                {/* AI Match Score */}
                                <div className="px-2">
                                    <div className={cn(
                                        "flex items-center justify-between mb-1.5",
                                        isRTL ? "flex-row-reverse" : ""
                                    )}>
                                        <span className={cn(
                                            "text-[10px] font-medium text-muted-foreground uppercase tracking-wide",
                                            isRTL ? "text-right" : "text-left"
                                        )}>
                                            {t("applicants.matchScore")}
                                        </span>
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            isRTL ? "flex-row-reverse" : ""
                                        )}>
                                            <Star className={cn("h-3 w-3 fill-current", getScoreColor(score))} />
                                            <span className={cn("text-sm font-bold", getScoreColor(score))}>
                                                {score}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                score >= 85 ? "bg-emerald-500" :
                                                score >= 70 ? "bg-blue-500" :
                                                "bg-purple-500",
                                                isRTL ? "origin-right" : "origin-left"
                                            )}
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Skills/Tags */}
                                {applicant.tags && applicant.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-center px-2">
                                        {applicant.tags.slice(0, 3).map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-medium bg-primary/10 text-primary border border-primary/20"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {applicant.tags.length > 3 && (
                                            <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-medium bg-muted text-muted-foreground">
                                                +{applicant.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Details Grid - Enhanced */}
                                <div className="space-y-2">
                                    {/* Experience */}
                                    {applicant.personalData?.yearsOfExperience !== undefined && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg",
                                            "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
                                            "border border-primary/20",
                                            "hover:border-primary/30 transition-colors",
                                            isRTL ? "flex-row-reverse" : ""
                                        )}>
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                                                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                            </div>
                                            <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                                                    {t("applicants.experience") || "Experience"}
                                                </p>
                                                <p className="text-xs font-semibold text-foreground">
                                                    {applicant.personalData.yearsOfExperience} {t("common.yearsShort")}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Applied Date */}
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg",
                                        "bg-gradient-to-r from-muted/80 via-muted/40 to-transparent",
                                        "border border-border/50",
                                        "hover:border-border transition-colors",
                                        isRTL ? "flex-row-reverse" : ""
                                    )}>
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted">
                                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </div>
                                        <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                                                {t("applicants.applied") || "Applied"}
                                            </p>
                                            <p className="text-xs font-semibold text-foreground">
                                                {formatDate(applicant.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full text-xs font-medium h-8"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onApplicantClick(applicant)
                                    }}
                                >
                                    {t("common.view")}
                                </Button>
                            </CardContent>
                        </Card>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
