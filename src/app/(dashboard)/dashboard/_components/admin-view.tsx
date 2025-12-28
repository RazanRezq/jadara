"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTranslate } from "@/hooks/useTranslate"
import {
    Users,
    Briefcase,
    Calendar,
    UserCheck,
    TrendingUp,
    TrendingDown,
    Star,
    MoreHorizontal,
    Plus,
    ExternalLink,
    Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
}

// Stat Card Component
function StatCard({
    title,
    value,
    trend,
    icon: Icon,
    iconBgColor,
    href,
}: {
    title: string
    value: number
    trend: number
    icon: React.ElementType
    iconBgColor: string
    href: string
}) {
    const { t } = useTranslate()
    const isPositive = trend >= 0

    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-card">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground font-medium">{title}</p>
                            <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
                            {trend !== 0 && (
                                <div className="flex items-center gap-1">
                                    {isPositive ? (
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                    )}
                                    <span
                                        className={cn(
                                            "text-sm font-medium",
                                            isPositive ? "text-emerald-500" : "text-red-500"
                                        )}
                                    >
                                        {isPositive ? "+" : ""}
                                        {trend}%
                                    </span>
                                </div>
                            )}
                        </div>
                        <div
                            className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center",
                                iconBgColor
                            )}
                        >
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

// Star Rating Component
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        starSize,
                        i < fullStars
                            ? "fill-amber-400 text-amber-400"
                            : i === fullStars && hasHalfStar
                            ? "fill-amber-400/50 text-amber-400"
                            : "fill-muted text-muted"
                    )}
                />
            ))}
        </div>
    )
}

// Action Center Component
function ActionCenter({
    candidates,
}: {
    candidates: AdminStats["actionCenter"]
}) {
    const { t } = useTranslate()

    return (
        <Card className="col-span-2 bg-white dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold">
                        {t("dashboard.admin.actionCenter")}
                    </CardTitle>
                    <CardDescription>
                        {t("dashboard.admin.actionCenterDesc")}
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                    <Plus className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {candidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {t("dashboard.admin.noActionRequired")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b">
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.candidateName")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.jobTitle")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.teamRating")}
                                    </th>
                                    <th className="text-end pb-3 font-medium">
                                        {t("dashboard.admin.actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {candidates.map((candidate) => (
                                    <tr key={candidate._id} className="group">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9">
                                                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                                        {candidate.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm">
                                                    {candidate.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-muted-foreground">
                                            {candidate.jobTitle}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={candidate.avgRating} />
                                                <span className="text-xs text-muted-foreground">
                                                    ({candidate.reviewCount})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-end">
                                            <Link href={`/dashboard/applicants/${candidate._id}`}>
                                                <Button size="sm" variant="outline">
                                                    {t("dashboard.admin.review")}
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Upcoming Schedule Component
function UpcomingSchedule({
    interviews,
}: {
    interviews: AdminStats["upcomingInterviews"]
}) {
    const { t } = useTranslate()

    const todayInterviews = interviews.filter((i) => i.isToday)
    const tomorrowInterviews = interviews.filter((i) => i.isTomorrow)

    return (
        <Card className="bg-white dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold">
                        {t("dashboard.admin.upcomingSchedule")}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {interviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        {t("dashboard.admin.noUpcomingInterviews")}
                    </div>
                ) : (
                    <>
                        {todayInterviews.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t("dashboard.admin.priority")}
                                </p>
                                {todayInterviews.map((interview) => (
                                    <div
                                        key={interview._id}
                                        className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">
                                                    {interview.candidateName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("dashboard.admin.today")} - {interview.scheduledTime}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {tomorrowInterviews.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t("dashboard.admin.other")}
                                </p>
                                {tomorrowInterviews.map((interview) => (
                                    <div
                                        key={interview._id}
                                        className="p-3 rounded-lg bg-muted/50 border"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">
                                                    {interview.candidateName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("dashboard.admin.tomorrow")} - {interview.scheduledTime}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
                        >
                            <Plus className="w-4 h-4 me-2" />
                            {t("dashboard.admin.createNewSchedule")}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslate()

    const statusConfig: Record<string, { color: string; bg: string }> = {
        new: { color: "text-blue-700", bg: "bg-blue-100" },
        screening: { color: "text-amber-700", bg: "bg-amber-100" },
        interviewing: { color: "text-purple-700", bg: "bg-purple-100" },
        evaluated: { color: "text-cyan-700", bg: "bg-cyan-100" },
        shortlisted: { color: "text-emerald-700", bg: "bg-emerald-100" },
        hired: { color: "text-green-700", bg: "bg-green-100" },
        rejected: { color: "text-red-700", bg: "bg-red-100" },
        withdrawn: { color: "text-gray-700", bg: "bg-gray-100" },
    }

    const config = statusConfig[status] || { color: "text-gray-700", bg: "bg-gray-100" }

    return (
        <Badge variant="secondary" className={cn("font-medium", config.bg, config.color)}>
            {t(`applicants.status.${status}`)}
        </Badge>
    )
}

// Recent Candidates Table Component
function RecentCandidatesTable({
    candidates,
}: {
    candidates: AdminStats["recentCandidates"]
}) {
    const { t } = useTranslate()

    return (
        <Card className="bg-white dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold">
                        {t("dashboard.admin.recentCandidates")}
                    </CardTitle>
                    <CardDescription>
                        {t("dashboard.admin.recentCandidatesDesc")}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 me-2" />
                        {t("dashboard.admin.export")}
                    </Button>
                    <Link href="/dashboard/applicants">
                        <Button size="sm">
                            <Plus className="w-4 h-4 me-2" />
                            {t("dashboard.admin.viewAll")}
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {candidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {t("dashboard.admin.noRecentActivity")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b">
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.candidateName")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.jobTitle")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.status")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.aiMatchScore")}
                                    </th>
                                    <th className="text-start pb-3 font-medium">
                                        {t("dashboard.admin.teamRating")}
                                    </th>
                                    <th className="text-end pb-3 font-medium">
                                        {t("dashboard.admin.actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {candidates.map((candidate) => (
                                    <tr key={candidate._id} className="group hover:bg-muted/30">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9">
                                                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                                        {candidate.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {candidate.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {candidate.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-muted-foreground">
                                            {candidate.jobTitle}
                                        </td>
                                        <td className="py-4">
                                            <StatusBadge status={candidate.status} />
                                        </td>
                                        <td className="py-4">
                                            <div
                                                className={cn(
                                                    "inline-flex items-center justify-center w-12 h-8 rounded-md text-sm font-semibold",
                                                    candidate.aiScore >= 70
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : candidate.aiScore >= 50
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700"
                                                )}
                                            >
                                                {candidate.aiScore}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {candidate.avgRating !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <StarRating rating={candidate.avgRating} />
                                                    <span className="text-xs text-muted-foreground">
                                                        ({candidate.reviewCount})
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {t("dashboard.admin.noRating")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/applicants/${candidate._id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-primary"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </Link>
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
    )
}

// Main AdminView Component
export function AdminView({ stats }: AdminViewProps) {
    const { t } = useTranslate()

    const statCards = [
        {
            title: t("dashboard.admin.totalApplicants"),
            value: stats.totalApplicants,
            trend: stats.totalApplicantsTrend,
            icon: Users,
            iconBgColor: "bg-gradient-to-br from-teal-400 to-teal-600",
            href: "/dashboard/applicants",
        },
        {
            title: t("dashboard.admin.activeJobs"),
            value: stats.activeJobs,
            trend: stats.activeJobsTrend,
            icon: Briefcase,
            iconBgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
            href: "/dashboard/jobs?status=active",
        },
        {
            title: t("dashboard.admin.interviewsScheduled"),
            value: stats.upcomingInterviewsCount,
            trend: stats.upcomingInterviewsTrend,
            icon: Calendar,
            iconBgColor: "bg-gradient-to-br from-emerald-400 to-emerald-600",
            href: "/dashboard/calendar",
        },
        {
            title: t("dashboard.admin.totalHired"),
            value: stats.totalHired,
            trend: stats.totalHiredTrend,
            icon: UserCheck,
            iconBgColor: "bg-gradient-to-br from-orange-400 to-orange-600",
            href: "/dashboard/applicants?status=hired",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {t("dashboard.admin.title")}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("dashboard.admin.subtitle")}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        trend={stat.trend}
                        icon={stat.icon}
                        iconBgColor={stat.iconBgColor}
                        href={stat.href}
                    />
                ))}
            </div>

            {/* Middle Section: Action Center + Upcoming Schedule */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <ActionCenter candidates={stats.actionCenter} />
                <UpcomingSchedule interviews={stats.upcomingInterviews} />
            </div>

            {/* Bottom Section: Recent Candidates Table */}
            <RecentCandidatesTable candidates={stats.recentCandidates} />
        </div>
    )
}
