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
    ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
}

interface ReviewerDashboardData {
    userName: string
    stats: {
        total: number
        pending: number
        completed: number
        progressPercent: number
    }
    pendingApplicants: ApplicantData[]
    completedApplicants: ApplicantData[]
}

interface ReviewerDashboardClientProps {
    data: ReviewerDashboardData
}

type FilterType = 'all' | 'pending' | 'completed'

type MergedApplicant = ApplicantData & {
    reviewStatus: 'pending' | 'completed'
}

export function ReviewerDashboardClient({ data }: ReviewerDashboardClientProps) {
    const { t, isRTL, dir } = useTranslate()
    const router = useRouter()

    const { userName, stats, pendingApplicants, completedApplicants } = data

    // --- State ---
    const [filter, setFilter] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // --- Data Processing ---
    const allApplicants = useMemo<MergedApplicant[]>(() => {
        const pending = pendingApplicants.map(a => ({ ...a, reviewStatus: 'pending' as const }))
        const completed = completedApplicants.map(a => ({ ...a, reviewStatus: 'completed' as const }))
        return [...pending, ...completed]
    }, [pendingApplicants, completedApplicants])

    const filteredApplicants = useMemo(() => {
        let filtered = allApplicants

        if (filter === 'pending') filtered = filtered.filter(a => a.reviewStatus === 'pending')
        if (filter === 'completed') filtered = filtered.filter(a => a.reviewStatus === 'completed')

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.jobTitle.toLowerCase().includes(query) ||
                a.email.toLowerCase().includes(query)
            )
        }
        return filtered
    }, [allApplicants, filter, searchQuery])

    const topCandidates = useMemo(() => {
        return completedApplicants
            .filter(a => a.aiScore !== undefined && a.aiScore !== null)
            .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
            .slice(0, 3)
    }, [completedApplicants])

    const avgAiScore = useMemo(() => {
        const scored = allApplicants.filter(a => a.aiScore !== undefined && a.aiScore !== null)
        if (scored.length === 0) return 0
        const sum = scored.reduce((acc, a) => acc + (a.aiScore || 0), 0)
        return Math.round(sum / scored.length)
    }, [allApplicants])

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
    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter)
    }

    const handleEvaluate = (applicantId: string) => {
        // change 'team_reviews' to 'review' to match the existing tab value
        router.push(`/dashboard/applicants?open=${applicantId}&tab=review`)
    }

    const handleContinueReviewing = () => {
        if (pendingApplicants.length > 0) {
            handleEvaluate(pendingApplicants[0]._id)
        }
    }

    return (
        <div dir={dir} className="min-h-screen bg-background font-sans pb-10 transition-colors duration-300">
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className={cn("text-2xl md:text-3xl font-bold tracking-tight text-foreground", isRTL ? "text-right" : "text-left")}>
                        {t("dashboard.reviewer.welcome")}, {userName}!
                    </h1>
                    <p className={cn("text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                        {t("dashboard.reviewer.subtitle")}
                    </p>
                </div>

                {/* Section 1: Top Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border border-border shadow-sm bg-card transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.totalApplicants")}
                            </CardTitle>
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.inYourQueue")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border shadow-sm bg-card transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.completedReviews")}
                            </CardTitle>
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.completed}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.progressPercent}% {t("dashboard.reviewer.completed")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border shadow-sm bg-card transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.pendingReviews")}
                            </CardTitle>
                            <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                                {stats.pending}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.awaitingYourReview")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border shadow-sm bg-card transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.reviewer.avgAiScore")}
                            </CardTitle>
                            <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {avgAiScore}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("dashboard.reviewer.overallAverage")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 2: Hero + Activity Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Hero Card */}
                    <div className="lg:col-span-4">
                        <Card className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white border border-border/10 shadow-lg relative overflow-hidden h-full">
                            <CardContent className="p-8 flex flex-col justify-between h-full min-h-[300px] relative z-10">
                                <div>
                                    <h3 className={cn("text-2xl md:text-3xl font-bold mb-2", isRTL ? "text-right" : "text-left")}>
                                        {t("dashboard.reviewer.currentSession")}
                                    </h3>
                                    <p className={cn("text-white/90 text-sm mb-8", isRTL ? "text-right" : "text-left")}>
                                        {t("dashboard.reviewer.reviewProgress")}
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/90">{t("dashboard.reviewer.progress")}</span>
                                            <span className="font-bold">{stats.progressPercent}%</span>
                                        </div>
                                        <Progress value={stats.progressPercent} className="h-3 bg-white/20" />
                                        <p className={cn("text-xs text-white/80", isRTL ? "text-right" : "text-left")}>
                                            {stats.completed} {t("dashboard.reviewer.of")} {stats.total} {t("dashboard.reviewer.applicantsReviewed")}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleContinueReviewing}
                                    disabled={stats.pending === 0}
                                    className="w-full bg-white text-primary hover:bg-white/90 font-bold text-base shadow-lg py-6"
                                    size="lg"
                                >
                                    {stats.pending > 0 ? (
                                        <>
                                            {t("dashboard.reviewer.continueReviewing")}
                                            {isRTL ? <ArrowLeft className="w-5 h-5 ms-2" /> : <ArrowRight className="w-5 h-5 ms-2" />}
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="w-5 h-5 me-2" />
                                            {t("dashboard.reviewer.allDone")}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart Section */}
                    <div className="lg:col-span-8">
                        <Card className="rounded-3xl h-full border border-border shadow-sm bg-card">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <div className="flex items-center justify-between">
                                    <CardTitle className={cn("text-lg md:text-xl font-bold text-foreground", isRTL ? "text-right" : "text-left")}>
                                        {t("dashboard.reviewer.reviewActivity")}
                                    </CardTitle>
                                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 p-6">
                                <div className="space-y-5">
                                    {/* Pending Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-20 text-sm font-medium shrink-0 text-foreground", isRTL ? "text-right" : "text-left")}>
                                            {t("dashboard.reviewer.pending")}
                                        </div>
                                        <div className="flex-1 h-11 border border-border rounded-xl overflow-hidden bg-transparent relative">
                                            <div
                                                className={cn(
                                                    "h-full bg-gradient-to-r from-orange-400/90 to-orange-500 flex items-center px-4 transition-all duration-500 relative z-10",
                                                    isRTL ? "justify-start" : "justify-end"
                                                )}
                                                style={{ width: `${stats.total > 0 ? Math.max((stats.pending / stats.total) * 100, 12) : 0}%` }}
                                            >
                                                {stats.pending > 0 && <span className="text-white font-bold text-sm">{stats.pending}</span>}
                                            </div>
                                            {stats.pending === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
                                                    0
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Completed Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-20 text-sm font-medium shrink-0 text-foreground", isRTL ? "text-right" : "text-left")}>
                                            {t("dashboard.reviewer.completed")}
                                        </div>
                                        <div className="flex-1 h-11 border border-border rounded-xl overflow-hidden bg-transparent relative">
                                            <div
                                                className={cn(
                                                    "h-full bg-gradient-to-r from-emerald-400/90 to-emerald-500 flex items-center px-4 transition-all duration-500 relative z-10",
                                                    isRTL ? "justify-start" : "justify-end"
                                                )}
                                                style={{ width: `${stats.total > 0 ? Math.max((stats.completed / stats.total) * 100, 12) : 0}%` }}
                                            >
                                                {stats.completed > 0 && <span className="text-white font-bold text-sm">{stats.completed}</span>}
                                            </div>
                                            {stats.completed === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
                                                    0
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Total Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-20 text-sm font-medium shrink-0 text-foreground", isRTL ? "text-right" : "text-left")}>
                                            {t("dashboard.reviewer.total")}
                                        </div>
                                        <div className="flex-1 h-11 border border-border rounded-xl overflow-hidden bg-transparent relative">
                                            <div
                                                className={cn(
                                                    "h-full bg-gradient-to-r from-blue-400/90 to-blue-500 flex items-center px-4 relative z-10",
                                                    isRTL ? "justify-start" : "justify-end"
                                                )}
                                                style={{ width: '100%' }}
                                            >
                                                <span className="text-white font-bold text-sm">{stats.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section 3: Bottom Content (Candidates + Sidebar) */}
                <div dir={dir} className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-[family-name:var(--font-ibm-plex-sans-arabic)] items-start">

                    {/* Main Candidates Table (75% Width) */}
                    <div className="lg:col-span-9">
                        <Card className="rounded-2xl border border-border shadow-sm bg-card h-full" dir={dir}>
                            <CardHeader className="pb-4 border-b border-border/50">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <CardTitle className="text-lg md:text-xl font-bold text-foreground">
                                        {t("dashboard.reviewer.recentCandidates")}
                                    </CardTitle>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <Select value={filter} onValueChange={(value) => handleFilterChange(value as FilterType)}>
                                            <SelectTrigger className="w-[140px] h-10 border-border bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t("common.all")} ({stats.total})</SelectItem>
                                                <SelectItem value="pending">{t("dashboard.reviewer.pending")} ({stats.pending})</SelectItem>
                                                <SelectItem value="completed">{t("dashboard.reviewer.completed")} ({stats.completed})</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="relative flex-1 md:w-[240px]">
                                            <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                                            <Input
                                                placeholder={t("dashboard.reviewer.searchCandidates")}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={cn("h-10 text-sm border-border bg-background", isRTL ? "pr-9" : "pl-9")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {filteredApplicants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Trophy className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1 text-foreground">{t("dashboard.reviewer.noResultsFound")}</h3>
                                        <p className="text-sm text-muted-foreground">{t("dashboard.reviewer.tryDifferentSearch")}</p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {/* TABLE HEADER */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/20 text-sm font-semibold text-muted-foreground">
                                            <div className={cn("col-span-5", isRTL ? "text-right" : "text-left")}>{t("applicants.candidate")}</div>
                                            <div className="col-span-2 text-center hidden md:block">{t("common.date")}</div>
                                            <div className="col-span-4 text-center hidden md:block">{t("common.status")}</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {/* TABLE BODY */}
                                        <div className="divide-y divide-border/50">
                                            {filteredApplicants.slice(0, 10).map((applicant, index) => (
                                                <div
                                                    key={applicant._id}
                                                    onClick={() => handleEvaluate(applicant._id)}
                                                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/40 cursor-pointer transition-colors items-center group"
                                                >
                                                    {/* Col 1: Candidate (Avatar + Name) */}
                                                    <div className="col-span-5 flex items-center gap-3">
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

                                                    {/* Col 2: Date */}
                                                    <div className="col-span-2 hidden md:flex items-center justify-center">
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{formatDate(applicant.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Col 3: Status & Score */}
                                                    <div className="col-span-4 hidden md:flex items-center justify-center gap-2">
                                                        {applicant.reviewStatus === 'completed' ? (
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs py-0.5 shadow-none">
                                                                <CheckCircle2 className={cn("w-3 h-3", isRTL ? "ml-1" : "mr-1")} />
                                                                {t("dashboard.reviewer.completed")}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs py-0.5 shadow-none">
                                                                <Clock className={cn("w-3 h-3", isRTL ? "ml-1" : "mr-1")} />
                                                                {t("dashboard.reviewer.pending")}
                                                            </Badge>
                                                        )}

                                                        {applicant.aiScore !== undefined && applicant.aiScore !== null && (
                                                            <Badge variant="secondary" className={cn("text-xs font-bold w-12 justify-center shadow-sm", getScoreBadgeColor(applicant.aiScore))}>
                                                                {applicant.aiScore}%
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Col 4: Action */}
                                                    <div className="col-span-1 flex items-center justify-end">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                                                            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
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
                                        {t("dashboard.reviewer.topPicks")}
                                    </CardTitle>
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-4">
                                {topCandidates.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                            <Star className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{t("dashboard.reviewer.noCandidatesScored")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {topCandidates.map((candidate, index) => (
                                            <div
                                                key={candidate._id}
                                                onClick={() => handleEvaluate(candidate._id)}
                                                className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-border hover:border-border/80 bg-background shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0",
                                                        index === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                                                        index === 1 && "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
                                                        index === 2 && "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
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
                                                <Badge variant="secondary" className={cn("text-xs font-bold px-2.5 py-1", isRTL ? "ml-2" : "mr-2", getScoreBadgeColor(candidate.aiScore || 0))}>
                                                    {candidate.aiScore}%
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