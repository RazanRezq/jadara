"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslate } from "@/hooks/useTranslate"
import {
    Users,
    Briefcase,
    Calendar,
    UserCheck,
    TrendingUp,
    TrendingDown,
    Star,
    ArrowRight,
    ArrowLeft,
    Video,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ViewApplicantDialog } from "@/app/(dashboard)/dashboard/applicants/_components/view-applicant-dialog"
import type { Applicant, EvaluationData } from "@/app/(dashboard)/dashboard/applicants/_components/types"
import type { UserRole } from "@/lib/auth"
import { DashboardWidget } from "@/components/dashboard/dashboard-widget"
import { getCardGradient } from "@/lib/card-gradients"

// Types
interface AdminStats {
    totalApplicants: number
    totalApplicantsTrend: number
    activeJobs: number
    activeJobsTrend: number
    upcomingInterviewsCount: number
    upcomingInterviewsTrend: number
    totalHired: number
    totalHiredTrend: number
    actionCenter: Array<{
        _id: string
        name: string
        email: string
        jobTitle: string
        jobId: string
        avgRating: number
        reviewCount: number
        submittedAt: Date
    }>
    upcomingInterviews: Array<{
        _id: string
        candidateName: string
        jobTitle: string
        scheduledTime: string
        meetingLink: string
        applicantId: string
        isToday: boolean
        isTomorrow: boolean
    }>
    recentCandidates: Array<{
        _id: string
        name: string
        email: string
        jobTitle: string
        jobId: string
        status: string
        aiScore: number
        avgRating: number | null
        reviewCount: number
        submittedAt: Date
    }>
}

interface AdminViewProps {
    stats: AdminStats
    userRole: UserRole
    userId: string
}


// Star Rating Component
function StarRating({ rating, showValue = false }: { rating: number; showValue?: boolean }) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "w-3.5 h-3.5",
                            i < fullStars
                                ? "fill-amber-400 text-amber-400"
                                : i === fullStars && hasHalfStar
                                ? "fill-amber-400/50 text-amber-400"
                                : "fill-muted text-muted"
                        )}
                    />
                ))}
            </div>
            {showValue && (
                <span className="text-xs font-medium text-muted-foreground">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    )
}

// Action Center Component - Optime Style
function ActionCenter({
    candidates,
    dir,
    userRole,
    userId,
    onRefresh,
}: {
    candidates: AdminStats["actionCenter"]
    dir: "ltr" | "rtl"
    userRole: UserRole
    userId: string
    onRefresh: () => void
}) {
    const { t } = useTranslate()
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationData | undefined>(undefined)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoadingApplicant, setIsLoadingApplicant] = useState(false)

    // Fetch full applicant data and evaluation
    const handleMakeDecision = async (applicantId: string) => {
        setIsLoadingApplicant(true)
        try {
            // Fetch applicant details
            const applicantResponse = await fetch(`/api/applicants/${applicantId}`)

            if (!applicantResponse.ok) {
                const errorText = await applicantResponse.text()
                console.error("Applicant fetch failed:", applicantResponse.status, errorText)
                toast.error(`Failed to load applicant: ${applicantResponse.status}`)
                return
            }

            const applicantData = await applicantResponse.json()

            if (!applicantData.success) {
                console.error("Applicant API error:", applicantData)
                toast.error(applicantData.error || t("common.error"))
                return
            }

            // Fetch evaluation data (optional - don't fail if missing)
            let evaluationData = null
            try {
                const evaluationResponse = await fetch(`/api/evaluations/by-applicant/${applicantId}`)
                if (evaluationResponse.ok) {
                    evaluationData = await evaluationResponse.json()
                }
            } catch (evalError) {
                console.warn("Evaluation fetch failed (non-critical):", evalError)
            }

            setSelectedApplicant(applicantData.applicant)
            setSelectedEvaluation(evaluationData?.success ? evaluationData.evaluation : undefined)
            setIsDialogOpen(true)
        } catch (error) {
            console.error("Failed to fetch applicant data:", error)
            toast.error(error instanceof Error ? error.message : t("common.error"))
        } finally {
            setIsLoadingApplicant(false)
        }
    }

    // Handle status change callback - refresh the action center
    const handleStatusChange = () => {
        setIsDialogOpen(false)
        setSelectedApplicant(null)
        setSelectedEvaluation(undefined)
        onRefresh()
    }

    return (
        <>
        <Card useMagic gradientVariant="applicants" className="border h-full bg-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {candidates.length > 0 && (
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        <CardTitle className="text-base font-semibold">
                            {t("dashboard.admin.actionCenter")}
                        </CardTitle>
                        {candidates.length > 0 && (
                            <Badge variant="secondary" className="text-xs font-medium">
                                {candidates.length}
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription className="text-xs">
                    {t("dashboard.admin.actionCenterDesc")}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t("dashboard.admin.noActionRequired")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {candidates.slice(0, 5).map((candidate) => (
                            <div
                                key={candidate._id}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                            >
                                <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                                        {candidate.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {candidate.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {candidate.jobTitle}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <StarRating rating={candidate.avgRating} />
                                    <span className="text-[10px] text-muted-foreground">
                                        {candidate.reviewCount} {t("dashboard.admin.reviews")}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 text-xs"
                                    onClick={() => handleMakeDecision(candidate._id)}
                                    disabled={isLoadingApplicant}
                                >
                                    {t("dashboard.admin.makeDecision")}
                                </Button>
                            </div>
                        ))}
                        {candidates.length > 5 && (
                            <Link href="/dashboard/applicants?status=evaluated">
                                <Button variant="ghost" className="w-full text-primary text-sm">
                                    {t("dashboard.admin.viewAll")} ({candidates.length})
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Applicant Details Dialog */}
        {selectedApplicant && (
            <ViewApplicantDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                applicant={selectedApplicant}
                evaluation={selectedEvaluation}
                userRole={userRole}
                userId={userId}
                onStatusChange={handleStatusChange}
                initialTab="overview"
                nextApplicantId={null}
            />
        )}
    </>
    )
}

// Upcoming Schedule Component - Optime Style
function UpcomingSchedule({
    interviews,
    dir,
}: {
    interviews: AdminStats["upcomingInterviews"]
    dir: "ltr" | "rtl"
}) {
    const { t } = useTranslate()

    const todayInterviews = interviews.filter((i) => i.isToday)
    const tomorrowInterviews = interviews.filter((i) => i.isTomorrow)

    return (
        <Card useMagic gradientVariant="interviews" className="border h-full bg-card">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base font-semibold">
                        {t("dashboard.admin.upcomingInterviews")}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
                {interviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Calendar className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t("dashboard.admin.noUpcomingInterviews")}
                        </p>
                        <Link href="/dashboard/calendar">
                            <Button variant="outline" size="sm" className="mt-3">
                                {t("dashboard.admin.scheduleInterview")}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Today's Interviews - Priority */}
                        {todayInterviews.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                        {t("dashboard.admin.today")}
                                    </p>
                                </div>
                                {todayInterviews.map((interview) => (
                                    <div
                                        key={interview._id}
                                        className="p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {interview.candidateName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {interview.scheduledTime}
                                                    </span>
                                                </div>
                                            </div>
                                            {interview.meetingLink && (
                                                <a
                                                    href={interview.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 gap-1.5 bg-red-500 hover:bg-red-600 text-white"
                                                    >
                                                        <Video className="w-3.5 h-3.5" />
                                                        {t("dashboard.admin.join")}
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tomorrow's Interviews */}
                        {tomorrowInterviews.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        {t("dashboard.admin.tomorrow")}
                                    </p>
                                </div>
                                {tomorrowInterviews.map((interview) => (
                                    <div
                                        key={interview._id}
                                        className="p-3 rounded-xl bg-muted/50 border border-border/50"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {interview.candidateName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {interview.scheduledTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link href="/dashboard/calendar" className="block">
                            <Button variant="outline" size="sm" className="w-full">
                                {t("dashboard.admin.viewAll")}
                            </Button>
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslate()

    // Golden List + Legacy (API normalizes legacy statuses before sending to client)
    const statusConfig: Record<string, { color: string; bg: string; darkBg: string }> = {
        // Golden List (5 statuses)
        new: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100", darkBg: "dark:bg-blue-900/30" },
        evaluated: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100", darkBg: "dark:bg-purple-900/30" },
        interview: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100", darkBg: "dark:bg-amber-900/30" },
        hired: { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100", darkBg: "dark:bg-emerald-900/30" },
        rejected: { color: "text-red-700 dark:text-red-300", bg: "bg-red-100", darkBg: "dark:bg-red-900/30" },
        // Legacy (for backwards compatibility - should not appear in normal flow)
        screening: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100", darkBg: "dark:bg-purple-900/30" },
        interviewing: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100", darkBg: "dark:bg-amber-900/30" },
        shortlisted: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100", darkBg: "dark:bg-purple-900/30" },
        withdrawn: { color: "text-red-700 dark:text-red-300", bg: "bg-red-100", darkBg: "dark:bg-red-900/30" },
    }

    const config = statusConfig[status] || { color: "text-gray-700", bg: "bg-gray-100", darkBg: "dark:bg-gray-900/30" }

    return (
        <Badge
            variant="secondary"
            className={cn("font-medium text-xs px-2 py-0.5", config.bg, config.darkBg, config.color)}
        >
            {t(`applicants.status.${status}`)}
        </Badge>
    )
}

// AI Score Badge Component
function AIScoreBadge({ score }: { score: number }) {
    const scoreConfig =
        score >= 80
            ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", icon: Sparkles }
            : score >= 60
            ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", icon: null }
            : { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: null }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
                scoreConfig.bg,
                scoreConfig.text
            )}
        >
            {scoreConfig.icon && <scoreConfig.icon className="w-3 h-3" />}
            {score}%
        </div>
    )
}

// Recent Candidates Table Component - Optime Style with Quick Actions
function RecentCandidatesTable({
    candidates,
    dir,
    locale,
}: {
    candidates: AdminStats["recentCandidates"]
    dir: "ltr" | "rtl"
    locale: string
}) {
    const { t } = useTranslate()
    const [actionCandidate, setActionCandidate] = useState<{
        id: string
        name: string
        action: "hire" | "reject"
    } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleQuickAction = async () => {
        if (!actionCandidate) return

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/applicants/${actionCandidate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: actionCandidate.action === "hire" ? "hired" : "rejected",
                }),
            })

            if (!response.ok) throw new Error("Failed to update status")

            toast.success(
                actionCandidate.action === "hire"
                    ? t("dashboard.admin.candidateHired")
                    : t("dashboard.admin.candidateRejected")
            )

            // Refresh the page to get updated data
            window.location.reload()
        } catch {
            toast.error(t("common.error"))
        } finally {
            setIsProcessing(false)
            setActionCandidate(null)
        }
    }

    const formatDate = (date: Date) => {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: locale === "ar" ? ar : enUS,
        })
    }

    return (
        <>
            <Card useMagic gradientVariant="users" className="border bg-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                {t("dashboard.admin.recentCandidates")}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {t("dashboard.admin.recentCandidatesDesc")}
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/applicants">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                {t("dashboard.admin.viewAll")}
                                {dir === "rtl" ? (
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                ) : (
                                    <ArrowRight className="w-3.5 h-3.5" />
                                )}
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {candidates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t("dashboard.admin.noRecentActivity")}
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-start px-6 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.candidateName")}
                                        </th>
                                        <th className="text-start px-3 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.jobTitle")}
                                        </th>
                                        <th className="text-start px-3 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.appliedDate")}
                                        </th>
                                        <th className="text-start px-3 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.status")}
                                        </th>
                                        <th className="text-start px-3 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.aiMatchScore")}
                                        </th>
                                        <th className="text-start px-3 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.teamRating")}
                                        </th>
                                        <th className="text-end px-6 pb-3 text-xs font-medium text-muted-foreground">
                                            {t("dashboard.admin.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {candidates.map((candidate) => (
                                        <tr
                                            key={candidate._id}
                                            className="group hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9 border border-border/50">
                                                        <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                                                            {candidate.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {candidate.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {candidate.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                                    {candidate.jobTitle}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(candidate.submittedAt)}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <StatusBadge status={candidate.status} />
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <AIScoreBadge score={candidate.aiScore} />
                                            </td>
                                            <td className="px-3 py-3.5">
                                                {candidate.avgRating !== null ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <StarRating rating={candidate.avgRating} />
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ({candidate.reviewCount})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {t("dashboard.admin.noRating")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <TooltipProvider delayDuration={0}>
                                                        {/* View Profile */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link
                                                                    href={`/dashboard/applicants?highlight=${candidate._id}`}
                                                                >
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {t("dashboard.admin.viewProfile")}
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        {/* Quick Hire - Only show for non-hired/rejected */}
                                                        {!["hired", "rejected", "withdrawn"].includes(
                                                            candidate.status
                                                        ) && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                                            onClick={() =>
                                                                                setActionCandidate({
                                                                                    id: candidate._id,
                                                                                    name: candidate.name,
                                                                                    action: "hire",
                                                                                })
                                                                            }
                                                                        >
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        {t("dashboard.admin.quickHire")}
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                            onClick={() =>
                                                                                setActionCandidate({
                                                                                    id: candidate._id,
                                                                                    name: candidate.name,
                                                                                    action: "reject",
                                                                                })
                                                                            }
                                                                        >
                                                                            <XCircle className="w-4 h-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        {t("dashboard.admin.quickReject")}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!actionCandidate} onOpenChange={() => setActionCandidate(null)}>
                <AlertDialogContent dir={dir}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionCandidate?.action === "hire"
                                ? t("dashboard.admin.confirmHire")
                                : t("dashboard.admin.confirmReject")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionCandidate?.action === "hire"
                                ? t("dashboard.admin.hireConfirmMessage")
                                : t("dashboard.admin.rejectConfirmMessage")}
                            <br />
                            <span className="font-medium text-foreground">
                                {actionCandidate?.name}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>
                            {t("common.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleQuickAction}
                            disabled={isProcessing}
                            className={cn(
                                actionCandidate?.action === "hire"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {isProcessing
                                ? t("common.loading")
                                : actionCandidate?.action === "hire"
                                ? t("dashboard.admin.hire")
                                : t("dashboard.admin.reject")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// Main AdminView Component - Optime Grid Layout
export function AdminView({ stats, userRole, userId }: AdminViewProps) {
    const { t, dir, locale, mounted } = useTranslate()

    // Refresh function - reload the page to get fresh data
    const handleRefresh = () => {
        window.location.reload()
    }

    if (!mounted) {
        return null
    }

    const applicantsGradient = getCardGradient("applicants")
    const jobsGradient = getCardGradient("jobs")
    const interviewsGradient = getCardGradient("interviews")
    const successGradient = getCardGradient("success")

    const statCards = [
        {
            title: t("dashboard.admin.totalApplicants"),
            value: stats.totalApplicants,
            trend: stats.totalApplicantsTrend,
            icon: Users,
            iconVariant: 'info' as const,
            iconColor: "text-teal-600 dark:text-teal-400",
            iconBgColor: "bg-teal-100 dark:bg-teal-900/30",
            gradientFrom: applicantsGradient.from,
            gradientTo: applicantsGradient.to,
            href: "/dashboard/applicants",
        },
        {
            title: t("dashboard.admin.activeJobs"),
            value: stats.activeJobs,
            trend: stats.activeJobsTrend,
            icon: Briefcase,
            iconVariant: 'primary' as const,
            iconColor: "text-blue-600 dark:text-blue-400",
            iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
            gradientFrom: jobsGradient.from,
            gradientTo: jobsGradient.to,
            href: "/dashboard/jobs?status=active",
        },
        {
            title: t("dashboard.admin.interviewsScheduled"),
            value: stats.upcomingInterviewsCount,
            trend: stats.upcomingInterviewsTrend,
            icon: Calendar,
            iconVariant: 'warning' as const,
            iconColor: "text-purple-600 dark:text-purple-400",
            iconBgColor: "bg-purple-100 dark:bg-purple-900/30",
            gradientFrom: interviewsGradient.from,
            gradientTo: interviewsGradient.to,
            href: "/dashboard/calendar",
        },
        {
            title: t("dashboard.admin.totalHired"),
            value: stats.totalHired,
            trend: stats.totalHiredTrend,
            icon: UserCheck,
            iconVariant: 'success' as const,
            iconColor: "text-emerald-600 dark:text-emerald-400",
            iconBgColor: "bg-emerald-100 dark:bg-emerald-900/30",
            gradientFrom: successGradient.from,
            gradientTo: successGradient.to,
            href: "/dashboard/applicants?status=hired",
        },
    ]

    return (
        <div className="dashboard-container space-y-6" dir={dir}>
            {/* Header - Clean and simple */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t("dashboard.admin.title")}
                </h1>
                <p className="text-muted-foreground text-base">
                    {t("dashboard.admin.subtitle")}
                </p>
            </div>

            {/* Row 1: Stats Grid - 4 columns on xl, 2 on md, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <DashboardWidget
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        trend={{
                            value: stat.trend,
                            label: t("dashboard.admin.vsLastMonth"),
                            isPositive: stat.trend >= 0,
                        }}
                        icon={stat.icon}
                        iconVariant={stat.iconVariant}
                        iconColor={stat.iconColor}
                        iconBgColor={stat.iconBgColor}
                        gradientFrom={stat.gradientFrom}
                        gradientTo={stat.gradientTo}
                        href={stat.href}
                    />
                ))}
            </div>

            {/* Row 2: Action Center (2/3) + Upcoming Schedule (1/3) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <ActionCenter
                        candidates={stats.actionCenter}
                        dir={dir}
                        userRole={userRole}
                        userId={userId}
                        onRefresh={handleRefresh}
                    />
                </div>
                <div className="xl:col-span-1">
                    <UpcomingSchedule interviews={stats.upcomingInterviews} dir={dir} />
                </div>
            </div>

            {/* Row 3: Recent Candidates Table - Full Width */}
            <RecentCandidatesTable
                candidates={stats.recentCandidates}
                dir={dir}
                locale={locale}
            />
        </div>
    )
}
