"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTranslate } from "@/hooks/useTranslate"
import {
    Star,
    Users,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface ReviewStatsProps {
    applicantId: string
    aiScore?: number
    currentUserId?: string
    currentUserRole?: string
    // Hoisted props to prevent refetching on tab switch
    reviews: Review[]
    stats: ReviewStats | null
    loading: boolean
}

interface ReviewStats {
    averageRating: number
    totalReviews: number
    decisions: {
        strongHire: number
        recommended: number
        neutral: number
        notRecommended: number
        strongNo: number
    }
}

interface Review {
    id: string
    rating: number
    decision: string
    pros: string[]
    cons: string[]
    summary?: string
    reviewer: {
        id: string
        name: string
        email: string
        role: string
    }
    createdAt: string
}

// Decision labels moved to function to access translations

export function ReviewStats({ applicantId, aiScore, currentUserId, currentUserRole, reviews, stats, loading }: ReviewStatsProps) {
    const { t, isRTL, dir } = useTranslate()
    const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

    const toggleExpanded = (reviewId: string) => {
        setExpandedReviews(prev => {
            const newSet = new Set(prev)
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId)
            } else {
                newSet.add(reviewId)
            }
            return newSet
        })
    }

    // Decision labels with translations
    const decisionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        strong_hire: {
            label: t("applicants.review.strongHire"),
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900",
            icon: <ThumbsUp className="h-3 w-3" />,
        },
        recommended: {
            label: t("applicants.review.recommended"),
            color: "text-green-600 bg-green-100 dark:bg-green-900",
            icon: <ThumbsUp className="h-3 w-3" />,
        },
        neutral: {
            label: t("applicants.review.neutral"),
            color: "text-gray-600 bg-gray-100 dark:bg-gray-800",
            icon: null,
        },
        not_recommended: {
            label: t("applicants.review.notRecommended"),
            color: "text-gray-700 bg-gray-100 dark:bg-gray-700",
            icon: <ThumbsDown className="h-3 w-3" />,
        },
        strong_no: {
            label: t("applicants.review.strongNo"),
            color: "text-red-600 bg-red-100 dark:bg-red-900",
            icon: <ThumbsDown className="h-3 w-3" />,
        },
    }

    // Data now comes from props - no useEffect needed!

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <Card dir={dir}>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!stats || stats.totalReviews === 0) {
        return (
            <Card dir={dir}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {t("applicants.review.teamReviews")}
                    </CardTitle>
                    <CardDescription>{t("applicants.review.humanRating")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t("applicants.review.noReviews")}</p>
                        <p className="text-xs mt-1">{t("applicants.review.submitReview")}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const positiveCount = stats.decisions.strongHire + stats.decisions.recommended
    const negativeCount = stats.decisions.notRecommended + stats.decisions.strongNo
    const positivePercentage = (positiveCount / stats.totalReviews) * 100

    return (
        <Card dir={dir}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t("applicants.review.teamReviews")}
                </CardTitle>
                <CardDescription>
                    {stats.totalReviews} {t("applicants.review.reviewSubmitted")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Human Rating */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                            <span className="text-2xl font-bold">
                                {stats.averageRating.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">/5</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("applicants.review.humanRating")}</p>
                    </div>

                    {/* AI Score */}
                    {aiScore !== undefined && (
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                <span className="text-2xl font-bold">{aiScore}</span>
                                <span className="text-sm text-muted-foreground">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{t("applicants.review.aiScore")}</p>
                        </div>
                    )}
                </div>

                {/* Decision Breakdown */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {positiveCount} {t("applicants.review.positive")}
                        </span>
                        <span className="text-red-600 flex items-center gap-1">
                            {negativeCount} {t("applicants.review.negative")}
                            <ThumbsDown className="h-4 w-4" />
                        </span>
                    </div>
                    <Progress
                        value={positivePercentage}
                        className="h-2"
                    />
                </div>

                <Separator />

                {/* Individual Reviews - Enhanced with Full Details */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">{t("applicants.review.allReviews")}</h4>
                    {reviews.map((review) => {
                        const decision = decisionLabels[review.decision]
                        const isExpanded = expandedReviews.has(review.id)
                        const hasDetails = review.pros.length > 0 || review.cons.length > 0 || review.summary
                        const isReviewer = currentUserRole === 'reviewer'
                        const isOwnReview = review.reviewer.id === currentUserId

                        return (
                            <div
                                key={review.id}
                                className="p-4 bg-muted/30 rounded-lg space-y-3 border border-border/50"
                            >
                                {/* Reviewer Info with Role Badge */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                                {getInitials(review.reviewer.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold">
                                                    {review.reviewer.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs px-1.5 py-0 h-5",
                                                        review.reviewer.role === 'superadmin' && "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-900/20",
                                                        review.reviewer.role === 'admin' && "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20",
                                                        review.reviewer.role === 'reviewer' && "border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-800"
                                                    )}
                                                >
                                                    {review.reviewer.role === 'superadmin' && t("roles.superadmin")}
                                                    {review.reviewer.role === 'admin' && t("roles.admin")}
                                                    {review.reviewer.role === 'reviewer' && t("roles.reviewer")}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(review.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Stars */}
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        "h-4 w-4",
                                                        star <= review.rating
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-gray-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Decision Badge */}
                                <div className="flex justify-start">
                                    <Badge
                                        variant="secondary"
                                        className={cn("text-xs px-2.5 py-1", decision?.color)}
                                    >
                                        {decision?.icon}
                                        <span className="ms-1.5">{decision?.label}</span>
                                    </Badge>
                                </div>

                                {/* Summary */}
                                {review.summary && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">{t("applicants.review.summary")}:</p>
                                        <p className="text-sm text-foreground">
                                            {review.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Pros Section */}
                                {review.pros.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {t("applicants.review.pros")}
                                        </p>
                                        <div className="space-y-1 ps-5">
                                            {review.pros.map((pro, i) => (
                                                <div key={`pro-${i}`} className="flex items-start gap-2 text-sm">
                                                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                                                    <span className="text-foreground">{pro}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cons Section */}
                                {review.cons.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                                            <XCircle className="h-3.5 w-3.5" />
                                            {t("applicants.review.cons")}
                                        </p>
                                        <div className="space-y-1 ps-5">
                                            {review.cons.map((con, i) => (
                                                <div key={`con-${i}`} className="flex items-start gap-2 text-sm">
                                                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                                                    <span className="text-foreground">{con}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Private Notes - Only visible to admins or the review author */}
                                {(review as any).privateNotes && (!isReviewer || isOwnReview) && (
                                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 -mx-4 -mb-3 px-4 pb-3 rounded-b-lg">
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-2">
                                            <Lock className="h-3.5 w-3.5" />
                                            {t("applicants.review.privateNotes")}
                                        </p>
                                        <p className="text-sm text-foreground ps-5">
                                            {(review as any).privateNotes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

// Compact version for dashboard/cards
export function ReviewStatsCompact({ applicantId }: { applicantId: string }) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<ReviewStats | null>(null)

    useEffect(() => {
        fetchStats()
    }, [applicantId])

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/reviews/average/${applicantId}`)
            const data = await response.json()
            if (data.success) setStats(data.stats)
        } catch (error) {
            console.error("Failed to fetch review stats:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !stats || stats.totalReviews === 0) return null

    return (
        <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
                ({stats.totalReviews})
            </span>
        </div>
    )
}
