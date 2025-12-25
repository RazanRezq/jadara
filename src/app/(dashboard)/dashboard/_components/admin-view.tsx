"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslate } from "@/hooks/useTranslate"
import {
    Users,
    Calendar,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminStats {
    actionRequired: number
    interviewsScheduled: number
    totalHired: number
    activeJobs: number
    applicationsLast30Days: Array<{ date: string; count: number }>
    funnelData: Array<{ stage: string; count: number }>
    recentApplicants: Array<{
        _id: string
        name: string
        jobTitle: string
        aiScore: number
        submittedAt: Date
    }>
}

interface AdminViewProps {
    stats: AdminStats
}

export function AdminView({ stats }: AdminViewProps) {
    const { t, isRTL } = useTranslate()

    const statCards = [
        {
            titleKey: "dashboard.admin.actionRequired",
            value: stats.actionRequired,
            icon: AlertCircle,
            color: "from-orange-500 to-red-500",
            shadowColor: "shadow-orange-500/20",
            href: "/dashboard/applicants?status=new",
            trend: null,
        },
        {
            titleKey: "dashboard.admin.interviewsScheduled",
            value: stats.interviewsScheduled,
            icon: Calendar,
            color: "from-blue-500 to-indigo-500",
            shadowColor: "shadow-blue-500/20",
            href: "/dashboard/applicants?status=interview_scheduled",
            trend: null,
        },
        {
            titleKey: "dashboard.admin.totalHired",
            value: stats.totalHired,
            icon: Users,
            color: "from-emerald-500 to-green-500",
            shadowColor: "shadow-emerald-500/20",
            href: "/dashboard/applicants?status=hired",
            trend: null,
        },
        {
            titleKey: "dashboard.admin.activeJobs",
            value: stats.activeJobs,
            icon: TrendingUp,
            color: "from-purple-500 to-pink-500",
            shadowColor: "shadow-purple-500/20",
            href: "/dashboard/jobs?status=active",
            trend: null,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.admin.title")}</h1>
                <p className="text-muted-foreground mt-1">{t("dashboard.admin.subtitle")}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link href={stat.href} key={index}>
                        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {t(stat.titleKey)}
                                </CardTitle>
                                <div
                                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor}`}
                                >
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Hiring Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("dashboard.admin.hiringFunnel")}</CardTitle>
                        <CardDescription>{t("dashboard.admin.hiringFunnelDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.funnelData} layout={isRTL ? "horizontal" : "vertical"}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="stage"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Application Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("dashboard.admin.applicationTrend")}</CardTitle>
                        <CardDescription>{t("dashboard.admin.applicationTrendDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.applicationsLast30Days}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.admin.recentActivity")}</CardTitle>
                    <CardDescription>{t("dashboard.admin.recentActivityDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentApplicants.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("dashboard.admin.noRecentActivity")}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentApplicants.map((applicant) => (
                                <Link
                                    key={applicant._id}
                                    href={`/dashboard/applicants/${applicant._id}`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{applicant.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {applicant.jobTitle}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {t("dashboard.admin.aiMatchScore")}
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-bold",
                                                    applicant.aiScore >= 70
                                                        ? "text-emerald-500"
                                                        : applicant.aiScore >= 50
                                                        ? "text-amber-500"
                                                        : "text-red-500"
                                                )}
                                            >
                                                {applicant.aiScore}%
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(applicant.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
