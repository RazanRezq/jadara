"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Sparkles,
    AlertCircle,
    Users,
    TrendingUp,
    ArrowUp,
    ArrowDown,
} from "lucide-react"

interface DashboardStatsProps {
    stats: {
        totalApplicants: number
        aiRecommended: number
        averageScore: number
        topMissingSkill: string
        comparedToLastMonth?: {
            applicants?: number
            recommended?: number
            score?: number
        }
    }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    const { t, isRTL } = useTranslate()

    const statCards = [
        {
            title: t("applicants.stats.avgScore"),
            value: `${Math.round(stats.averageScore)}%`,
            icon: TrendingUp,
            color: "from-violet-500 to-purple-500",
            bgColor: "bg-violet-50 dark:bg-violet-950/30",
            iconBg: "bg-violet-100 dark:bg-violet-900/50",
            change: stats.comparedToLastMonth?.score,
            changeLabel: t("applicants.stats.vsLastMonth"),
        },
        {
            title: t("applicants.stats.bestCandidates"),
            value: stats.aiRecommended.toString(),
            icon: Users,
            color: "from-cyan-500 to-blue-500",
            bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
            iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
            change: stats.comparedToLastMonth?.recommended,
            changeLabel: t("applicants.stats.vsLastMonth"),
        },
        {
            title: t("applicants.stats.missingSkills"),
            value: stats.topMissingSkill || "-",
            icon: AlertCircle,
            color: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-50 dark:bg-amber-950/30",
            iconBg: "bg-amber-100 dark:bg-amber-900/50",
            isSkill: true,
        },
        {
            title: t("applicants.stats.aiRecommendations"),
            value: stats.aiRecommended.toString(),
            icon: Sparkles,
            color: "from-emerald-500 to-teal-500",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            change: stats.comparedToLastMonth?.applicants,
            changeLabel: t("applicants.stats.newApplicants"),
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
                <Card 
                    key={index}
                    className={cn(
                        "border-0 shadow-sm transition-all duration-200 hover:shadow-md",
                        stat.bgColor
                    )}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground mb-1">
                                    {stat.title}
                                </p>
                                <p className={cn(
                                    "font-bold",
                                    stat.isSkill ? "text-xl" : "text-3xl"
                                )}>
                                    {stat.value}
                                </p>
                                
                                {/* Change indicator */}
                                {stat.change !== undefined && (
                                    <div className="flex items-center gap-1 mt-2 text-sm">
                                        {stat.change >= 0 ? (
                                            <>
                                                <ArrowUp className="h-3 w-3 text-emerald-500" />
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    {stat.change}%
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <ArrowDown className="h-3 w-3 text-red-500" />
                                                <span className="text-red-600 dark:text-red-400">
                                                    {Math.abs(stat.change)}%
                                                </span>
                                            </>
                                        )}
                                        <span className="text-muted-foreground text-xs">
                                            {stat.changeLabel}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className={cn(
                                "p-3 rounded-xl",
                                stat.iconBg
                            )}>
                                <stat.icon className={cn(
                                    "h-6 w-6 bg-gradient-to-br bg-clip-text",
                                    stat.color.replace("from-", "text-").split(" ")[0]
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}



