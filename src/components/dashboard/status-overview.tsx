"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Users, UserCheck, Calendar, CheckCircle2 } from "lucide-react"

interface StatusCount {
    status: string
    count: number
}

interface StatusOverviewProps {
    statuses: StatusCount[]
    className?: string
}

// Status configuration with modern colors and gradient variants
const STATUS_CONFIG = {
    new: {
        label: "applicants.kanban.new",
        icon: Users,
        gradientVariant: "jobs" as const,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        labelColor: "text-blue-700 dark:text-blue-300",
        numberBg: "bg-blue-100 dark:bg-blue-900/50",
        numberColor: "text-blue-900 dark:text-blue-100",
    },
    evaluated: {
        label: "applicants.kanban.evaluated",
        icon: UserCheck,
        gradientVariant: "analytics" as const,
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800",
        labelColor: "text-purple-700 dark:text-purple-300",
        numberBg: "bg-purple-100 dark:bg-purple-900/50",
        numberColor: "text-purple-900 dark:text-purple-100",
    },
    interview: {
        label: "applicants.kanban.interview",
        icon: Calendar,
        gradientVariant: "warning" as const,
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800",
        labelColor: "text-amber-700 dark:text-amber-300",
        numberBg: "bg-amber-100 dark:bg-amber-900/50",
        numberColor: "text-amber-900 dark:text-amber-100",
    },
    hired: {
        label: "applicants.kanban.hired",
        icon: CheckCircle2,
        gradientVariant: "success" as const,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        labelColor: "text-emerald-700 dark:text-emerald-300",
        numberBg: "bg-emerald-100 dark:bg-emerald-900/50",
        numberColor: "text-emerald-900 dark:text-emerald-100",
    },
}

export function StatusOverview({ statuses, className }: StatusOverviewProps) {
    const { t, isRTL } = useTranslate()

    // Reverse the order for RTL (New -> Hired becomes right to left)
    const displayStatuses = isRTL ? [...statuses].reverse() : statuses

    return (
        <div
            dir={isRTL ? "rtl" : "ltr"}
            className={cn(
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
                className
            )}
        >
            {displayStatuses.map((statusData) => {
                const config = STATUS_CONFIG[statusData.status as keyof typeof STATUS_CONFIG]
                if (!config) return null

                const Icon = config.icon

                return (
                    <Card
                        key={statusData.status}
                        gradientVariant={config.gradientVariant}
                        className={cn(
                            "border transition-all duration-200 hover:shadow-md",
                            config.bgColor,
                            config.borderColor
                        )}
                    >
                        <CardContent className="p-4">
                            {/* RTL: Label on RIGHT, Number on LEFT */}
                            {/* LTR: Label on LEFT, Number on RIGHT */}
                            <div className="flex flex-row justify-between items-center gap-3">
                                {/* Status Label */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Icon
                                        className={cn("h-5 w-5 shrink-0", config.labelColor)}
                                    />
                                    <span
                                        dir={isRTL ? "rtl" : "ltr"}
                                        className={cn(
                                            "text-sm font-semibold truncate",
                                            config.labelColor
                                        )}
                                    >
                                        {t(config.label)}
                                    </span>
                                </div>

                                {/* Number/Counter - High Contrast */}
                                <div
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xl font-bold shrink-0",
                                        config.numberBg,
                                        config.numberColor
                                    )}
                                >
                                    {statusData.count}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
