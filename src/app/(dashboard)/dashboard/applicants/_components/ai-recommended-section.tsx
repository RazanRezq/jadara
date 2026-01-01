"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Star, Briefcase, ChevronRight, Sparkles } from "lucide-react"
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
    const { t, isRTL } = useTranslate()

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
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-gray-200 to-gray-100",
            "from-pink-400 to-rose-500",
        ]
        const index = (name?.charCodeAt(0) || 0) % gradients.length
        return gradients[index]
    }

    return (
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
            {/* Section Header */}
            <div className={cn(
                "flex items-center gap-2",
                isRTL ? "flex-row-reverse" : "flex-row"
            )}>
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className={cn(
                    "text-xl font-bold",
                    ibmPlexArabic.className
                )}>
                    موصى به من الذكاء الاصطناعي
                </h2>
            </div>

            {/* Cards Grid - Horizontal Layout (5 columns) */}
            <div className={cn(
                "grid gap-4",
                // Responsive: 1 column on mobile, 2 on sm, 3 on md, 5 on lg+
                "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            )}>
                {topApplicants.map((applicant, index) => {
                    const score = applicant.aiScore || 0

                    return (
                        <BackgroundGradient
                            key={applicant.id}
                            className="rounded-3xl"
                            containerClassName="w-full"
                        >
                            <Card
                                dir={isRTL ? "rtl" : "ltr"}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-card/95 backdrop-blur-sm h-full",
                                    ibmPlexArabic.className
                                )}
                                onClick={() => onApplicantClick(applicant)}
                            >
                                <CardContent className="p-5 space-y-4">
                                    {/* Rank Badge */}
                                    <div className={cn(
                                        "flex items-center justify-between",
                                        isRTL ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <Badge
                                            variant="secondary"
                                            className="bg-primary/10 text-primary font-bold text-xs px-2 py-1"
                                        >
                                            #{index + 1}
                                        </Badge>
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            isRTL ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {score}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex justify-center">
                                        <div
                                            className={cn(
                                                "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl",
                                                getAvatarGradient(applicant.displayName || applicant.personalData?.name || "A")
                                            )}
                                        >
                                            {(applicant.displayName || applicant.personalData?.name)?.charAt(0)?.toUpperCase() || 'A'}
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="text-center">
                                        <h3 className="font-bold text-base truncate">
                                            {applicant.displayName || applicant.personalData?.name || "Unnamed"}
                                        </h3>
                                    </div>

                                    {/* Job Title */}
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-xs text-muted-foreground justify-center",
                                        isRTL ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {applicant.jobId?.title || "N/A"}
                                        </span>
                                    </div>

                                    {/* Tags (max 2) */}
                                    {applicant.tags && applicant.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {applicant.tags.slice(0, 2).map((tag, tagIndex) => (
                                                <Badge
                                                    key={tagIndex}
                                                    variant="secondary"
                                                    className="text-[10px] h-5 px-2 bg-muted/60"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* View Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onApplicantClick(applicant)
                                        }}
                                    >
                                        {t("common.view")}
                                        <ChevronRight className="h-3 w-3 ms-1 rtl:rotate-180" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </BackgroundGradient>
                    )
                })}
            </div>
        </div>
    )
}
