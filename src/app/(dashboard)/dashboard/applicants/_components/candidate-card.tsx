"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Sparkles,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Clock,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Applicant, BilingualTextArray } from "./applicants-client"

interface CandidateCardProps {
    applicant: Applicant
    evaluation?: {
        overallScore: number
        recommendation: 'hire' | 'hold' | 'reject' | 'pending'
        strengths: BilingualTextArray | string[]
        weaknesses: BilingualTextArray | string[]
        criteriaMatches: Array<{
            criteriaName: string
            matched: boolean
            score: number
        }>
    }
    onView: (applicant: Applicant) => void
    isRecommended?: boolean
}

export function CandidateCard({ applicant, evaluation, onView, isRecommended }: CandidateCardProps) {
    const { t, isRTL, locale } = useTranslate()

    // Helper to get bilingual array based on current locale
    const getLocalizedArray = (arr: BilingualTextArray | string[] | undefined): string[] => {
        if (!arr) return []
        if (Array.isArray(arr)) return arr // Legacy format
        return locale === 'ar' ? (arr.ar || arr.en || []) : (arr.en || arr.ar || [])
    }

    const score = evaluation?.overallScore ?? applicant.aiScore
    const strengths = getLocalizedArray(evaluation?.strengths)
    const weaknesses = getLocalizedArray(evaluation?.weaknesses)

    // Calculate missing skills from criteria matches
    const missingSkills = evaluation?.criteriaMatches
        ?.filter(c => !c.matched)
        .map(c => c.criteriaName) ?? []

    const getScoreColor = (score?: number) => {
        if (!score) return "bg-muted text-muted-foreground"
        if (score >= 75) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
        if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
    }

    const getScoreTextColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400"
        if (score >= 50) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    // Generate avatar colors based on name
    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-400 to-rose-500",
            "from-indigo-400 to-blue-500",
        ]
        const index = name.charCodeAt(0) % gradients.length
        return gradients[index]
    }

    return (
        <Card
            className={cn(
                "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30",
                isRecommended && "ring-2 ring-primary/20 bg-primary/[0.02]"
            )}
            onClick={() => onView(applicant)}
        >
            <CardContent className="p-4">
                {/* Header with score and menu */}
                <div className="flex items-start justify-between mb-3">
                    {/* AI Recommended Badge */}
                    {isRecommended && (
                        <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-0 gap-1"
                        >
                            <Sparkles className="h-3 w-3" />
                            {t("applicants.aiRecommended")}
                        </Badge>
                    )}

                    {/* Score Badge */}
                    <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold",
                        getScoreColor(score),
                        !isRecommended && "ml-auto"
                    )}>
                        <span className={cn("text-xl", getScoreTextColor(score))}>
                            {score ? `${score}%` : "-"}
                        </span>
                    </div>

                    {/* More menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                onView(applicant)
                            }}>
                                {t("common.viewDetails")}
                            </DropdownMenuItem>
                            {applicant.cvUrl && (
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(applicant.cvUrl, "_blank")
                                }}>
                                    {t("applicants.downloadCV")}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Candidate Info */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Avatar */}
                    <div className={cn(
                        "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-lg shrink-0",
                        getAvatarGradient(applicant.personalData?.name || "A")
                    )}>
                        {applicant.personalData?.name?.charAt(0)?.toUpperCase() || 'A'}
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base truncate">
                                {applicant.personalData?.name || applicant.personalData?.email?.split('@')[0] || 'Unknown'}
                            </h3>
                            {applicant.isSuspicious && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            {applicant.jobId?.title || t("applicants.noJob")}
                        </p>
                    </div>
                </div>

                {/* Experience Badge */}
                {applicant.personalData?.yearsOfExperience !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            {applicant.personalData.yearsOfExperience}+ {t("applicants.yearsExp")}
                        </Badge>
                    </div>
                )}

                {/* Skills/Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {applicant.tags?.slice(0, 4).map((tag, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-muted/80"
                        >
                            {tag}
                        </Badge>
                    ))}
                    {applicant.tags && applicant.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs bg-muted/50">
                            +{applicant.tags.length - 4}
                        </Badge>
                    )}
                </div>

                {/* Strengths & Weaknesses Summary */}
                <div className="flex items-center justify-between text-sm border-t pt-3">
                    {/* Strengths */}
                    {strengths.length > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>{strengths.length} {t("applicants.strengths")}</span>
                        </div>
                    )}

                    {/* Missing Skills */}
                    {missingSkills.length > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <XCircle className="h-4 w-4" />
                            <span>{missingSkills.length} {t("applicants.missing")}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

