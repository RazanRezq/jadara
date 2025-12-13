"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslate } from "@/hooks/useTranslate"
import { hasPermission, type UserRole } from "@/lib/auth"
import {
    Users,
    FileText,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    BookOpen,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SessionData {
    name: string
    role: UserRole
}

export default function DashboardPage() {
    const router = useRouter()
    const { t, isRTL } = useTranslate()
    const [session, setSession] = useState<SessionData | null>(null)

    useEffect(() => {
        // Extract session from JWT cookie
        const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('session='))
        if (sessionCookie) {
            try {
                const token = sessionCookie.split('=')[1]
                const payload = JSON.parse(atob(token.split('.')[1]))
                setSession({ name: payload.name, role: payload.role })
            } catch {
                router.push("/login")
            }
        }
    }, [router])

    const stats = [
        {
            titleKey: "dashboard.totalContent",
            value: "2,847",
            change: "+12.5%",
            trend: "up",
            icon: FileText,
            color: "from-cyan-500 to-teal-500",
            shadowColor: "shadow-cyan-500/20",
        },
        {
            titleKey: "dashboard.activeUsers",
            value: "1,234",
            change: "+8.2%",
            trend: "up",
            icon: Users,
            color: "from-indigo-500 to-purple-500",
            shadowColor: "shadow-indigo-500/20",
        },
        {
            titleKey: "dashboard.pendingReviews",
            value: "42",
            change: "-3.1%",
            trend: "down",
            icon: Clock,
            color: "from-amber-500 to-orange-500",
            shadowColor: "shadow-amber-500/20",
        },
        {
            titleKey: "dashboard.completionRate",
            value: "94.2%",
            change: "+2.4%",
            trend: "up",
            icon: TrendingUp,
            color: "from-emerald-500 to-green-500",
            shadowColor: "shadow-emerald-500/20",
        },
    ]

    const recentActivities = [
        {
            titleKey: "activities.newReadingPassage",
            descriptionKey: "activities.academicReadingTest",
            descriptionSuffix: " #47",
            time: "2",
            timeKey: "activities.minutesAgo",
            icon: BookOpen,
            iconBg: "bg-cyan-500/10 text-cyan-500",
        },
        {
            titleKey: "activities.reviewCompleted",
            descriptionKey: "activities.writingTaskSample",
            descriptionSuffix: " #128",
            time: "15",
            timeKey: "activities.minutesAgo",
            icon: CheckCircle2,
            iconBg: "bg-emerald-500/10 text-emerald-500",
        },
        {
            titleKey: "activities.newFeedback",
            descriptionKey: "activities.listeningImprovements",
            descriptionSuffix: "",
            time: "1",
            timeKey: "activities.hourAgo",
            icon: MessageSquare,
            iconBg: "bg-indigo-500/10 text-indigo-500",
        },
        {
            titleKey: "activities.contentNeedsRevision",
            descriptionKey: "activities.speakingTopicCards",
            descriptionSuffix: "",
            time: "3",
            timeKey: "activities.hoursAgo",
            icon: AlertCircle,
            iconBg: "bg-amber-500/10 text-amber-500",
        },
    ]

    const userRole = session?.role || "reviewer"
    const userName = session?.name || "..."

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-sidebar to-sidebar/80">
                <div className={cn(
                    "absolute top-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl",
                    isRTL ? "left-0" : "right-0"
                )} />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl lg:text-3xl">
                        {t("dashboard.welcomeBack")}، {userName}! 👋
                    </CardTitle>
                    <CardDescription className="text-base">
                        {t("dashboard.loggedInAs")}{" "}
                        <span className="text-primary font-medium">
                            {t(`roles.${userRole}`)}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex flex-wrap gap-3">
                        {hasPermission(userRole, "superadmin") && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <span className="text-amber-500 text-sm font-medium">
                                    {t("dashboard.fullSystemAccess")}
                                </span>
                            </div>
                        )}
                        {hasPermission(userRole, "admin") && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <span className="text-indigo-500 text-sm font-medium">
                                    {t("dashboard.userManagement")}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-emerald-500 text-sm font-medium">
                                {t("dashboard.contentReview")}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="relative overflow-hidden">
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
                            <div className="flex items-center gap-1 mt-1">
                                {stat.trend === "up" ? (
                                    <span className="flex items-center text-emerald-500 text-sm font-medium">
                                        <ArrowUpRight className="w-4 h-4" />
                                        {stat.change}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-red-500 text-sm font-medium">
                                        <ArrowDownRight className="w-4 h-4" />
                                        {stat.change}
                                    </span>
                                )}
                                <span className="text-muted-foreground text-sm">{t("dashboard.vsLastMonth")}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentActivities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.iconBg}`}
                                >
                                    <activity.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {t(activity.titleKey)}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {t(activity.descriptionKey)}{activity.descriptionSuffix}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {activity.time} {t(activity.timeKey)}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Quick Actions & Permissions */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("dashboard.quickActions")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:from-cyan-500/20 hover:to-teal-500/20 transition-all">
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">{t("dashboard.addNewContent")}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border text-foreground hover:bg-muted transition-all">
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-medium">{t("dashboard.reviewPending")}</span>
                        </button>
                        {hasPermission(userRole, "admin") && (
                            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border text-foreground hover:bg-muted transition-all">
                                <Users className="w-5 h-5" />
                                <span className="font-medium">{t("dashboard.manageUsers")}</span>
                            </button>
                        )}

                        {/* Role Info */}
                        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                            <h3 className="text-sm font-medium mb-3">
                                {t("dashboard.yourPermissions")}
                            </h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t("dashboard.viewEditContent")}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t("dashboard.submitReviews")}
                                </li>
                                {hasPermission(userRole, "admin") && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {t("dashboard.manageUsers")}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {t("sidebar.analytics")}
                                        </li>
                                    </>
                                )}
                                {hasPermission(userRole, "superadmin") && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {t("dashboard.systemSettings")}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {t("dashboard.roleManagement")}
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
