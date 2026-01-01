"use client"

import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBadge } from "@/components/ui/icon-badge"
import { cn } from "@/lib/utils"
import {
    Trophy,
    TrendingUp,
    Users,
    Inbox,
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
    const { t } = useTranslate()

    const statsCards = [
        {
            label: t("applicants.stats.totalApplicants"),
            value: stats.totalApplicants,
            icon: Inbox,
            variant: 'primary' as const,
        },
        {
            label: t("applicants.stats.avgScore"),
            value: `${Math.round(stats.averageScore)}%`,
            icon: TrendingUp,
            variant: 'info' as const,
        },
        {
            label: t("applicants.stats.bestCandidates"),
            value: stats.aiRecommended,
            icon: Trophy,
            variant: 'success' as const,
        },
        {
            label: t("applicants.stats.aiRecommendations"),
            value: stats.aiRecommended,
            icon: Users,
            variant: 'warning' as const,
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, index) => (
                <Card
                    key={index}
                    className="relative overflow-hidden transition-all hover:shadow-lg border bg-card"
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.label}
                        </CardTitle>
                        <IconBadge icon={card.icon} variant={card.variant} size="sm" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}








