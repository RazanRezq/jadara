"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslate } from "@/hooks/useTranslate"
import { Users, Briefcase, Activity, Plus, Edit, UserX } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { UserRole } from "@/lib/auth"
import { getRoleColor } from "@/lib/authClient"
import { DashboardWidgetCompact, DashboardWidgetAnalytics } from "@/components/dashboard/dashboard-widget"
import { AnalyticsCardWithChart } from "@/components/dashboard/analytics-card-with-chart"
import { getCardGradient } from "@/lib/card-gradients"
import { cn } from "@/lib/utils"

interface SuperAdminStats {
    totalUsers: number
    totalJobs: number
    systemHealth: "healthy" | "warning" | "critical"
    users: Array<{
        _id: string
        name: string
        email: string
        role: UserRole
        isActive: boolean
        lastLogin?: Date
    }>
    // Real analytics data from database
    userAnalytics: {
        roleStats: {
            total: number
            superadmin: number
            admin: number
            reviewer: number
        }
        activityStats: {
            total: number
            active: number
            inactive: number
            recentlyActive: number
        }
    }
    platformServices: {
        reviews: {
            total: number
            strongHire: number
            recommended: number
            neutral: number
            notRecommended: number
            strongNo: number
        }
        interviews: {
            total: number
            scheduled: number
            confirmed: number
            completed: number
            cancelled: number
            noShow: number
        }
        responses: {
            total: number
            text: number
            voice: number
            multipleChoice: number
            file: number
        }
        applicants: {
            total: number
            new: number
            evaluated: number
            interview: number
            hired: number
            rejected: number
        }
    }
}

interface SuperAdminViewProps {
    stats: SuperAdminStats
}

export function SuperAdminView({ stats }: SuperAdminViewProps) {
    const { t, mounted } = useTranslate()
    const usersGradient = getCardGradient("users")
    const jobsGradient = getCardGradient("jobs")
    const successGradient = getCardGradient("success")
    const warningGradient = getCardGradient("warning")
    const dangerGradient = getCardGradient("danger")
    const analyticsGradient = getCardGradient("analytics")
    const reviewsGradient = getCardGradient("reviews")
    const interviewsGradient = getCardGradient("interviews")
    const applicantsGradient = getCardGradient("applicants")

    const getHealthGradient = (health: string) => {
        switch (health) {
            case "healthy":
                return successGradient
            case "warning":
                return warningGradient
            case "critical":
                return dangerGradient
            default:
                return getCardGradient("neutral")
        }
    }

    const getHealthText = (health: string) => {
        switch (health) {
            case "healthy":
                return t("dashboard.superAdmin.systemHealthy")
            case "warning":
                return t("dashboard.superAdmin.systemWarning")
            case "critical":
                return t("dashboard.superAdmin.systemCritical")
            default:
                return t("dashboard.superAdmin.systemUnknown")
        }
    }

    const healthGradient = getHealthGradient(stats.systemHealth)

    if (!mounted) {
        return null
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Header - Clean and simple */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t("dashboard.superAdmin.title")}
                </h1>
                <p className="text-muted-foreground text-base">{t("dashboard.superAdmin.subtitle")}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardWidgetCompact
                    title={t("dashboard.superAdmin.totalUsers")}
                    value={stats.totalUsers}
                    icon={Users}
                    iconVariant="primary"
                    iconColor="text-blue-600 dark:text-blue-400"
                    iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                    gradientFrom={usersGradient.from}
                    gradientTo={usersGradient.to}
                    description={t("dashboard.superAdmin.registeredUsers")}
                />

                <DashboardWidgetCompact
                    title={t("dashboard.superAdmin.totalJobs")}
                    value={stats.totalJobs}
                    icon={Briefcase}
                    iconVariant="info"
                    iconColor="text-purple-600 dark:text-purple-400"
                    iconBgColor="bg-purple-100 dark:bg-purple-900/30"
                    gradientFrom={jobsGradient.from}
                    gradientTo={jobsGradient.to}
                    description={t("dashboard.superAdmin.systemWide")}
                />

                <DashboardWidgetCompact
                    title={t("dashboard.superAdmin.systemHealth")}
                    value={getHealthText(stats.systemHealth)}
                    gradientFrom={healthGradient.from}
                    gradientTo={healthGradient.to}
                    icon={Activity}
                    iconVariant={stats.systemHealth === "healthy" ? "success" : stats.systemHealth === "warning" ? "warning" : "danger"}
                    iconColor="text-white"
                    iconBgColor={`bg-gradient-to-br from-[${healthGradient.from}] to-[${healthGradient.to}]`}
                    description={t("dashboard.superAdmin.allSystemsOperational")}
                />
            </div>

            {/* User Analytics Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t("dashboard.superAdmin.userAnalytics")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Users by Role */}
                    <DashboardWidgetAnalytics
                        title={t("dashboard.superAdmin.usersByRole")}
                        value={stats.userAnalytics.roleStats.total}
                        icon={Users}
                        iconVariant="primary"
                        gradientFrom={jobsGradient.from}
                        gradientTo={jobsGradient.to}
                        breakdowns={[
                            {
                                label: t("roles.superadmin"),
                                value: stats.userAnalytics.roleStats.superadmin,
                                percentage: Math.round(
                                    (stats.userAnalytics.roleStats.superadmin / stats.userAnalytics.roleStats.total) * 100
                                ),
                                color: "#ef4444"
                            },
                            {
                                label: t("roles.admin"),
                                value: stats.userAnalytics.roleStats.admin,
                                percentage: Math.round(
                                    (stats.userAnalytics.roleStats.admin / stats.userAnalytics.roleStats.total) * 100
                                ),
                                color: "#9ca3af"
                            },
                            {
                                label: t("roles.reviewer"),
                                value: stats.userAnalytics.roleStats.reviewer,
                                percentage: Math.round(
                                    (stats.userAnalytics.roleStats.reviewer / stats.userAnalytics.roleStats.total) * 100
                                ),
                                color: "#3b82f6"
                            }
                        ]}
                    />

                    {/* User Activity */}
                    <DashboardWidgetAnalytics
                        title={t("dashboard.superAdmin.userActivity")}
                        value={stats.userAnalytics.activityStats.total}
                        icon={Activity}
                        iconVariant="success"
                        gradientFrom={successGradient.from}
                        gradientTo={successGradient.to}
                        breakdowns={[
                            {
                                label: t("common.active"),
                                value: stats.userAnalytics.activityStats.active,
                                percentage: Math.round(
                                    (stats.userAnalytics.activityStats.active / stats.userAnalytics.activityStats.total) * 100
                                ),
                                color: "#10b981"
                            },
                            {
                                label: t("common.inactive"),
                                value: stats.userAnalytics.activityStats.inactive,
                                percentage: Math.round(
                                    (stats.userAnalytics.activityStats.inactive / stats.userAnalytics.activityStats.total) * 100
                                ),
                                color: "#6b7280"
                            }
                        ]}
                    />

                    {/* Recent Active Users */}
                    <DashboardWidgetAnalytics
                        title={t("dashboard.superAdmin.recentActivity")}
                        value={stats.userAnalytics.activityStats.recentlyActive}
                        icon={Activity}
                        iconVariant="info"
                        gradientFrom={getCardGradient("analytics").from}
                        gradientTo={getCardGradient("analytics").to}
                        breakdowns={[
                            {
                                label: t("dashboard.superAdmin.activeLastMonth"),
                                value: stats.userAnalytics.activityStats.recentlyActive,
                                percentage: Math.round(
                                    (stats.userAnalytics.activityStats.recentlyActive / stats.userAnalytics.activityStats.total) * 100
                                ),
                                color: "#8b5cf6"
                            },
                            {
                                label: t("dashboard.superAdmin.dormant"),
                                value: stats.userAnalytics.activityStats.total - stats.userAnalytics.activityStats.recentlyActive,
                                percentage: Math.round(
                                    ((stats.userAnalytics.activityStats.total - stats.userAnalytics.activityStats.recentlyActive) / stats.userAnalytics.activityStats.total) * 100
                                ),
                                color: "#94a3b8"
                            }
                        ]}
                    />

                    {/* Total Users Summary */}
                    <DashboardWidgetCompact
                        title={t("dashboard.superAdmin.totalUsers")}
                        value={stats.totalUsers}
                        icon={Users}
                        iconVariant="primary"
                        iconColor="text-blue-600 dark:text-blue-400"
                        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                        gradientFrom={usersGradient.from}
                        gradientTo={usersGradient.to}
                        description={t("dashboard.superAdmin.registeredUsers")}
                    />
                </div>
            </div>

            {/* Platform Services Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    {t("dashboard.superAdmin.platformServices")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Team Reviews */}
                    <AnalyticsCardWithChart
                        title={t("dashboard.superAdmin.teamReviews")}
                        value={stats.platformServices.reviews.total}
                        icon={Activity}
                        iconVariant="success"
                        gradientFrom={reviewsGradient.from}
                        gradientTo={reviewsGradient.to}
                        chartType="donut"
                        breakdowns={[
                            {
                                label: t("dashboard.superAdmin.strongHire"),
                                value: stats.platformServices.reviews.strongHire,
                                percentage: stats.platformServices.reviews.total > 0 ? Math.round(
                                    (stats.platformServices.reviews.strongHire / stats.platformServices.reviews.total) * 100
                                ) : 0,
                                color: "#10b981"
                            },
                            {
                                label: t("dashboard.superAdmin.recommended"),
                                value: stats.platformServices.reviews.recommended,
                                percentage: stats.platformServices.reviews.total > 0 ? Math.round(
                                    (stats.platformServices.reviews.recommended / stats.platformServices.reviews.total) * 100
                                ) : 0,
                                color: "#3b82f6"
                            },
                            {
                                label: t("dashboard.superAdmin.neutral"),
                                value: stats.platformServices.reviews.neutral,
                                percentage: stats.platformServices.reviews.total > 0 ? Math.round(
                                    (stats.platformServices.reviews.neutral / stats.platformServices.reviews.total) * 100
                                ) : 0,
                                color: "#9ca3af"
                            },
                            {
                                label: t("dashboard.superAdmin.notRecommended"),
                                value: stats.platformServices.reviews.notRecommended + stats.platformServices.reviews.strongNo,
                                percentage: stats.platformServices.reviews.total > 0 ? Math.round(
                                    ((stats.platformServices.reviews.notRecommended + stats.platformServices.reviews.strongNo) / stats.platformServices.reviews.total) * 100
                                ) : 0,
                                color: "#ef4444"
                            }
                        ]}
                    />

                    {/* Interviews */}
                    <AnalyticsCardWithChart
                        title={t("dashboard.superAdmin.interviews")}
                        value={stats.platformServices.interviews.total}
                        icon={Users}
                        iconVariant="warning"
                        gradientFrom={interviewsGradient.from}
                        gradientTo={interviewsGradient.to}
                        chartType="donut"
                        breakdowns={[
                            {
                                label: t("dashboard.superAdmin.scheduled"),
                                value: stats.platformServices.interviews.scheduled,
                                percentage: stats.platformServices.interviews.total > 0 ? Math.round(
                                    (stats.platformServices.interviews.scheduled / stats.platformServices.interviews.total) * 100
                                ) : 0,
                                color: "#9ca3af"
                            },
                            {
                                label: t("dashboard.superAdmin.confirmed"),
                                value: stats.platformServices.interviews.confirmed,
                                percentage: stats.platformServices.interviews.total > 0 ? Math.round(
                                    (stats.platformServices.interviews.confirmed / stats.platformServices.interviews.total) * 100
                                ) : 0,
                                color: "#3b82f6"
                            },
                            {
                                label: t("dashboard.superAdmin.completed"),
                                value: stats.platformServices.interviews.completed,
                                percentage: stats.platformServices.interviews.total > 0 ? Math.round(
                                    (stats.platformServices.interviews.completed / stats.platformServices.interviews.total) * 100
                                ) : 0,
                                color: "#10b981"
                            }
                        ]}
                    />

                    {/* Responses */}
                    <AnalyticsCardWithChart
                        title={t("dashboard.superAdmin.candidateResponses")}
                        value={stats.platformServices.responses.total}
                        icon={Activity}
                        iconVariant="info"
                        gradientFrom={analyticsGradient.from}
                        gradientTo={analyticsGradient.to}
                        chartType="donut"
                        breakdowns={[
                            {
                                label: t("dashboard.superAdmin.textResponse"),
                                value: stats.platformServices.responses.text,
                                percentage: stats.platformServices.responses.total > 0 ? Math.round(
                                    (stats.platformServices.responses.text / stats.platformServices.responses.total) * 100
                                ) : 0,
                                color: "#3b82f6"
                            },
                            {
                                label: t("dashboard.superAdmin.voiceResponse"),
                                value: stats.platformServices.responses.voice,
                                percentage: stats.platformServices.responses.total > 0 ? Math.round(
                                    (stats.platformServices.responses.voice / stats.platformServices.responses.total) * 100
                                ) : 0,
                                color: "#8b5cf6"
                            },
                            {
                                label: t("dashboard.superAdmin.fileResponse"),
                                value: stats.platformServices.responses.file,
                                percentage: stats.platformServices.responses.total > 0 ? Math.round(
                                    (stats.platformServices.responses.file / stats.platformServices.responses.total) * 100
                                ) : 0,
                                color: "#9ca3af"
                            }
                        ]}
                    />

                    {/* Applications */}
                    <AnalyticsCardWithChart
                        title={t("dashboard.superAdmin.applications")}
                        value={stats.platformServices.applicants.total}
                        icon={Briefcase}
                        iconVariant="primary"
                        gradientFrom={applicantsGradient.from}
                        gradientTo={applicantsGradient.to}
                        chartType="donut"
                        breakdowns={[
                            {
                                label: t("applicants.status.new"),
                                value: stats.platformServices.applicants.new,
                                percentage: stats.platformServices.applicants.total > 0 ? Math.round(
                                    (stats.platformServices.applicants.new / stats.platformServices.applicants.total) * 100
                                ) : 0,
                                color: "#3b82f6"
                            },
                            {
                                label: t("applicants.status.evaluated"),
                                value: stats.platformServices.applicants.evaluated,
                                percentage: stats.platformServices.applicants.total > 0 ? Math.round(
                                    (stats.platformServices.applicants.evaluated / stats.platformServices.applicants.total) * 100
                                ) : 0,
                                color: "#9ca3af"
                            },
                            {
                                label: t("applicants.status.interview"),
                                value: stats.platformServices.applicants.interview,
                                percentage: stats.platformServices.applicants.total > 0 ? Math.round(
                                    (stats.platformServices.applicants.interview / stats.platformServices.applicants.total) * 100
                                ) : 0,
                                color: "#8b5cf6"
                            },
                            {
                                label: t("applicants.status.hired"),
                                value: stats.platformServices.applicants.hired,
                                percentage: stats.platformServices.applicants.total > 0 ? Math.round(
                                    (stats.platformServices.applicants.hired / stats.platformServices.applicants.total) * 100
                                ) : 0,
                                color: "#10b981"
                            }
                        ]}
                    />
                </div>
            </div>

            {/* User Management */}
            <Card
                useMagic
                className="border bg-card"
                gradientFrom={usersGradient.from}
                gradientTo={usersGradient.to}
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("dashboard.superAdmin.userManagement")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.superAdmin.userManagementDesc")}
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/users">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t("dashboard.superAdmin.createNewUser")}
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-medium">{t("dashboard.superAdmin.noUsers")}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("dashboard.superAdmin.createFirstUser")}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("common.name")}</TableHead>
                                        <TableHead>{t("common.email")}</TableHead>
                                        <TableHead>{t("common.role")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>{t("users.lastLogin")}</TableHead>
                                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(
                                                        user.role
                                                    )}`}
                                                >
                                                    {t(`roles.${user.role}`)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.isActive ? (
                                                    <Badge variant="default" className="bg-emerald-500">
                                                        {t("common.active")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {t("common.inactive")}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLogin
                                                    ? new Date(user.lastLogin).toLocaleDateString()
                                                    : t("users.never")}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/dashboard/users/${user._id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="sm" className="text-red-500">
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
