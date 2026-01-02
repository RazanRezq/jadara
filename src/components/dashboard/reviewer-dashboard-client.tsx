"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslate } from "@/hooks/useTranslate"
import {
    CheckCircle2,
    Clock,
    Users,
    ArrowLeft,
    Trophy,
    Star,
    TrendingUp,
    Search,
    Calendar,
    BarChart3,
    Lightbulb,
    Target,
    ArrowRight,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { RatingDistribution } from "@/components/reviewer/rating-distribution"

// --- Interfaces ---
interface ApplicantData {
    _id: string
    name: string
    email: string
    jobId: string
    jobTitle: string
    status: string
    createdAt: string
    sessionId: string
    aiScore?: number
    myRating?: number
    reviewedAt?: string
}

interface ReviewerDashboardData {
    userId: string
    userName: string
    stats: {
        total: number
        pending: number
        completed: number
        progressPercent: number
    }
    pendingApplicants: ApplicantData[]
    completedApplicants: ApplicantData[]
    ratingDistribution?: {
        distribution: Array<{ rating: number; count: number }>
        total: number
    }
}

interface ReviewerDashboardClientProps {
    data: ReviewerDashboardData
}

type FilterType = 'all' | 'pending' | 'completed'

type MergedApplicant = ApplicantData & {
    reviewStatus: 'pending' | 'completed'
}

export function ReviewerDashboardClient({ data }: ReviewerDashboardClientProps) {
    const { t, isRTL, dir, mounted } = useTranslate()
    const router = useRouter()

    const { userId, userName, stats, pendingApplicants, completedApplicants, ratingDistribution } = data

    // --- State ---
    const [searchQuery, setSearchQuery] = useState('')

    // --- Data Processing (ALL HOOKS MUST BE BEFORE EARLY RETURN) ---
    // Only show completed applicants (those reviewed by this reviewer)
    const filteredApplicants = useMemo(() => {
        let filtered = completedApplicants

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.jobTitle.toLowerCase().includes(query) ||
                a.email.toLowerCase().includes(query)
            )
        }
        return filtered
    }, [completedApplicants, searchQuery])

    const topCandidates = useMemo(() => {
        return completedApplicants
            .filter(a => a.myRating !== undefined && a.myRating !== null)
            .sort((a, b) => (b.myRating || 0) - (a.myRating || 0))
            .slice(0, 3)
    }, [completedApplicants])

    const avgMyRating = useMemo(() => {
        const rated = completedApplicants.filter(a => a.myRating !== undefined && a.myRating !== null)
        if (rated.length === 0) return 0
        const sum = rated.reduce((acc, a) => acc + (a.myRating || 0), 0)
        return (sum / rated.length).toFixed(1)
    }, [completedApplicants])

    // Calculate recent reviews (last 7 days)
    const recentReviews = useMemo(() => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return completedApplicants.filter(a => {
            const reviewDate = new Date(a.reviewedAt || a.createdAt)
            return reviewDate >= sevenDaysAgo
        }).length
    }, [completedApplicants])

    // Calculate rating consistency (standard deviation)
    const ratingConsistency = useMemo(() => {
        const rated = completedApplicants.filter(a => a.myRating !== undefined && a.myRating !== null)
        if (rated.length < 2) return null

        const avg = typeof avgMyRating === 'number' ? avgMyRating : parseFloat(avgMyRating)
        const squareDiffs = rated.map(a => Math.pow((a.myRating || 0) - avg, 2))
        const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / rated.length
        const stdDev = Math.sqrt(avgSquareDiff)

        // Return consistency rating (lower std dev = more consistent)
        if (stdDev < 0.5) return 'high'
        if (stdDev < 1.0) return 'medium'
        return 'low'
    }, [completedApplicants, avgMyRating])

    // Calculate rating breakdown (how many of each rating)
    const ratingBreakdown = useMemo(() => {
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        completedApplicants.forEach(a => {
            if (a.myRating !== undefined && a.myRating !== null) {
                breakdown[Math.round(a.myRating) as keyof typeof breakdown]++
            }
        })
        return breakdown
    }, [completedApplicants])

    // Total rated applicants
    const totalRated = useMemo(() => {
        return completedApplicants.filter(a => a.myRating !== undefined && a.myRating !== null).length
    }, [completedApplicants])

    // --- Helpers ---
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    const getInitials = (name: string): string => {
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const getScoreBadgeColor = (score: number) => {
        if (score >= 70) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
        if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    }

    const getRatingBadgeColor = (rating: number) => {
        if (rating >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
        if (rating >= 3) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        if (rating >= 2) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    }

    const getAvatarColor = (index: number) => {
        const colors = [
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
        ]
        return colors[index % colors.length]
    }

    // --- Handlers ---
    const handleViewApplicant = (applicantId: string) => {
        router.push(`/dashboard/applicants?open=${applicantId}&tab=review`)
    }

    const handleViewAllApplicants = () => {
        router.push('/dashboard/applicants')
    }

    if (!mounted) {
        return null
    }

    return (
        <div dir={dir} className="min-h-screen bg-background font-sans pb-10 transition-colors duration-300">
            <div className="dashboard-container p-4 md:p-6 space-y-8">

                {/* Header */}
                <PageHeader
                    title={`${t("dashboard.reviewer.welcome")}, ${userName}!`}
                    subtitleKey="dashboard.reviewer.subtitle"
                    className="px-0 pt-0"
                    iconSize="h-6 w-6 md:h-7 md:w-7"
                    titleClassName="text-2xl md:text-3xl"
                />

                {/* Section 1: Top Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="rounded-2xl border hover:shadow-lg transition-all hover:border-primary/50 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.myReviews")}
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.applicantsReviewed")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border hover:shadow-lg transition-all hover:border-primary/50 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.avgMyRating")}
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">
                                {avgMyRating}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.outOf5Stars")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border hover:shadow-lg transition-all hover:border-primary/50 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.topRated")}
                            </CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {topCandidates.length > 0 ? topCandidates[0].myRating : '-'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.highestRating")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 2: Review Activity Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Review Performance Card */}
                    <Card className="rounded-2xl border shadow-sm bg-card">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">
                                        {t("dashboard.reviewer.myReviewHistory")}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t("dashboard.reviewer.trackYourReviews")}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Primary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-xs text-muted-foreground">
                                            {t("dashboard.reviewer.totalReviews")}
                                        </span>
                                    </div>
                                    <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs text-muted-foreground">
                                            {t("dashboard.reviewer.avgRating")}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-amber-600">{avgMyRating}</span>
                                        <span className="text-sm text-muted-foreground">/5</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Recent Activity */}
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-medium text-blue-900 dark:text-blue-100">{t("dashboard.reviewer.last7Days")}</span>
                                    </div>
                                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{recentReviews}</div>
                                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{t("dashboard.reviewer.reviews")}</p>
                                </div>

                                {/* Top Rating */}
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">{t("dashboard.reviewer.bestScore")}</span>
                                    </div>
                                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                        {topCandidates.length > 0 ? topCandidates[0].myRating : '-'}
                                    </div>
                                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{t("dashboard.reviewer.rating")}</p>
                                </div>
                            </div>

                            {/* Quick Rating Breakdown */}
                            {totalRated > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">{t("dashboard.reviewer.myRatingBreakdown")}</span>
                                        {ratingConsistency && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs",
                                                    ratingConsistency === 'high' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                                                    ratingConsistency === 'medium' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                                                    ratingConsistency === 'low' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                                )}
                                            >
                                                {ratingConsistency === 'high' ? t("dashboard.reviewer.consistent") : ratingConsistency === 'medium' ? t("dashboard.reviewer.moderate") : t("dashboard.reviewer.varied")}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count = ratingBreakdown[rating as keyof typeof ratingBreakdown]
                                            const percentage = totalRated > 0 ? (count / totalRated) * 100 : 0
                                            const barColor = rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-500' : 'bg-rose-500'

                                            return (
                                                <div key={rating} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <Star className={cn("w-3 h-3 fill-current",
                                                                rating >= 4 ? "text-emerald-500" : rating === 3 ? "text-amber-500" : "text-rose-500"
                                                            )} />
                                                            <span className="text-muted-foreground">{rating}</span>
                                                        </div>
                                                        <span className="font-medium text-foreground">{count}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleViewAllApplicants}
                                className="w-full"
                                variant="default"
                            >
                                {t("dashboard.reviewer.viewAllApplicants")}
                                {isRTL ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Rating Distribution */}
                    <RatingDistribution
                        reviewerId={userId}
                        initialData={ratingDistribution}
                        avgRating={typeof avgMyRating === 'number' ? avgMyRating : parseFloat(avgMyRating)}
                    />
                </div>

                {/* Section 3: Bottom Content (Candidates + Sidebar) */}
                <div dir={dir} className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-[family-name:var(--font-ibm-plex-sans-arabic)] items-start">

                    {/* Main Reviews Table (75% Width) */}
                    <div className="lg:col-span-9">
                        <Card className="rounded-2xl border border-border shadow-sm bg-card h-full" dir={dir}>
                            <CardHeader className="pb-4 border-b border-border/50">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg md:text-xl font-bold text-foreground">
                                            {t("dashboard.reviewer.myReviewsList")}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t("dashboard.reviewer.candidatesIReviewed")}
                                        </p>
                                    </div>

                                    <div className="relative w-full md:w-[280px]">
                                        <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                                        <Input
                                            placeholder={t("dashboard.reviewer.searchMyReviews")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={cn("h-10 text-sm border-border bg-background", isRTL ? "pr-9" : "pl-9")}
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {filteredApplicants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1 text-foreground">
                                            {searchQuery ? t("dashboard.reviewer.noResultsFound") : t("dashboard.reviewer.noReviewsYet")}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {searchQuery ? t("dashboard.reviewer.tryDifferentSearch") : t("dashboard.reviewer.startReviewingApplicants")}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {/* TABLE HEADER */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/20 text-sm font-semibold text-muted-foreground">
                                            <div className={cn("col-span-4", isRTL ? "text-right" : "text-left")}>{t("applicants.candidate")}</div>
                                            <div className="col-span-2 text-center hidden md:block">{t("dashboard.reviewer.reviewDate")}</div>
                                            <div className="col-span-2 text-center hidden md:block">{t("dashboard.reviewer.myRating")}</div>
                                            <div className="col-span-2 text-center hidden md:block">{t("dashboard.reviewer.aiScore")}</div>
                                            <div className="col-span-2"></div>
                                        </div>

                                        {/* TABLE BODY */}
                                        <div className="divide-y divide-border/50">
                                            {filteredApplicants.slice(0, 10).map((applicant, index) => (
                                                <div
                                                    key={applicant._id}
                                                    onClick={() => handleViewApplicant(applicant._id)}
                                                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/40 cursor-pointer transition-colors items-center group"
                                                >
                                                    {/* Col 1: Candidate (Avatar + Name) */}
                                                    <div className="col-span-4 flex items-center gap-3">
                                                        <Avatar className={cn("h-10 w-10 flex-shrink-0 border border-border/40", getAvatarColor(index))}>
                                                            <AvatarFallback className="text-xs font-bold">
                                                                {getInitials(applicant.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={cn("min-w-0 flex-1", isRTL ? "text-right" : "text-left")}>
                                                            <div className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                                                {applicant.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                {applicant.jobTitle}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Col 2: Review Date */}
                                                    <div className="col-span-2 hidden md:flex items-center justify-center">
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{formatDate(applicant.reviewedAt || applicant.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Col 3: My Rating */}
                                                    <div className="col-span-2 hidden md:flex items-center justify-center">
                                                        {applicant.myRating !== undefined && applicant.myRating !== null ? (
                                                            <Badge variant="outline" className={cn("text-xs font-bold px-3 py-1 shadow-sm", getRatingBadgeColor(applicant.myRating))}>
                                                                <Star className={cn("w-3 h-3 fill-current", isRTL ? "ml-1" : "mr-1")} />
                                                                {applicant.myRating}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </div>

                                                    {/* Col 4: AI Score */}
                                                    <div className="col-span-2 hidden md:flex items-center justify-center">
                                                        {applicant.aiScore !== undefined && applicant.aiScore !== null ? (
                                                            <Badge variant="secondary" className={cn("text-xs font-bold px-3 py-1 shadow-sm", getScoreBadgeColor(applicant.aiScore))}>
                                                                {applicant.aiScore}%
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </div>

                                                    {/* Col 5: Action */}
                                                    <div className="col-span-2 flex items-center justify-end">
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                                                            {t("common.view")}
                                                            {isRTL ? <ArrowLeft className="w-3 h-3 ms-1" /> : <ArrowRight className="w-3 h-3 ms-1" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-3 sticky top-6 self-start space-y-6">
                        {/* 1. Top Rated Card */}
                        <Card className="rounded-2xl h-fit border border-border shadow-sm bg-card">
                            <CardHeader className="pb-2 border-b border-border/50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg md:text-xl font-bold text-foreground">
                                        {t("dashboard.reviewer.myTopRated")}
                                    </CardTitle>
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-4">
                                {topCandidates.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                            <Star className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{t("dashboard.reviewer.noRatedCandidates")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {topCandidates.map((candidate, index) => (
                                            <div
                                                key={candidate._id}
                                                onClick={() => handleViewApplicant(candidate._id)}
                                                className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-border hover:border-border/80 bg-background shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0",
                                                        index === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                                                        index === 1 && "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
                                                        index === 2 && "bg-white text-gray-800 dark:bg-gray-300/20 dark:text-gray-200"
                                                    )}>
                                                        #{index + 1}
                                                    </div>
                                                    <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                                                        <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(index))}>
                                                            {getInitials(candidate.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn("min-w-0", isRTL ? "text-right" : "text-left")}>
                                                        <h4 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors truncate max-w-[100px] text-foreground">
                                                            {candidate.name}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                            {candidate.jobTitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={cn("text-xs font-bold px-2.5 py-1 flex items-center gap-1", isRTL ? "ml-2" : "mr-2", getRatingBadgeColor(candidate.myRating || 0))}>
                                                    <Star className="w-3 h-3 fill-current" />
                                                    {candidate.myRating}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Extra "Tips" Card */}
                        <Card className="rounded-2xl border border-border shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <CardContent className={cn("p-5 flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                                <div className="p-2 bg-background rounded-full shadow-sm shrink-0">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                                    <h4 className="font-bold text-sm mb-1 text-foreground">
                                        {t("dashboard.reviewer.reviewerTip")}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {t("dashboard.reviewer.reviewerTipDesc")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}