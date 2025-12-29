"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MagicCard } from "@/components/magicui/magic-card"
import { IconBadge } from "@/components/ui/icon-badge"
import { cn } from "@/lib/utils"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { useTheme } from "next-themes"

interface DashboardWidgetProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconColor?: string
    iconBgColor?: string
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    href?: string
    className?: string
    children?: React.ReactNode
    gradientColor?: string
}

export function DashboardWidget({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    iconVariant = 'default',
    trend,
    href,
    className,
    children,
    gradientColor = "#4f46e5",
}: DashboardWidgetProps) {
    const { theme } = useTheme()
    const isPositive = trend ? trend.isPositive !== false : true

    const content = (
        <>
            {theme === "dark" ? (
                <MagicCard
                    className={cn(
                        "relative overflow-hidden rounded-lg border border-border bg-background",
                        href && "cursor-pointer",
                        className
                    )}
                    gradientFrom={gradientColor}
                    gradientTo={`${gradientColor}80`}
                    gradientSize={150}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-x-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {title}
                                </h3>
                                <div className="text-2xl font-bold">
                                    {typeof value === "number" ? value.toLocaleString() : value}
                                </div>
                            </div>
                            <IconBadge icon={Icon} variant={iconVariant} size="md" />
                        </div>

                        {children}

                        {trend && (
                            <div className="mt-4 flex items-center gap-x-2 text-sm">
                                <span
                                    className={cn(
                                        "flex items-center",
                                        isPositive ? "text-emerald-600" : "text-red-600"
                                    )}
                                >
                                    {isPositive ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span className="ms-1">
                                        {Math.abs(trend.value).toFixed(1)}%
                                    </span>
                                </span>
                                <span className="text-muted-foreground">
                                    {trend.label}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </MagicCard>
            ) : (
                <div className={cn(
                    "relative overflow-hidden rounded-lg border border-border bg-card",
                    href && "cursor-pointer",
                    className
                )}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-x-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {title}
                                </h3>
                                <div className="text-2xl font-bold">
                                    {typeof value === "number" ? value.toLocaleString() : value}
                                </div>
                            </div>
                            <IconBadge icon={Icon} variant={iconVariant} size="md" />
                        </div>

                        {children}

                        {trend && (
                            <div className="mt-4 flex items-center gap-x-2 text-sm">
                                <span
                                    className={cn(
                                        "flex items-center",
                                        isPositive ? "text-emerald-600" : "text-red-600"
                                    )}
                                >
                                    {isPositive ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span className="ms-1">
                                        {Math.abs(trend.value).toFixed(1)}%
                                    </span>
                                </span>
                                <span className="text-muted-foreground">
                                    {trend.label}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </div>
            )}
        </>
    )

    if (href) {
        return (
            <a href={href} className="block h-full">
                {content}
            </a>
        )
    }

    return content
}

// Compact variant for smaller widgets
export function DashboardWidgetCompact({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    iconVariant = 'default',
    description,
    className,
    gradientColor = "#4f46e5",
}: {
    title: string
    value: string | number
    icon: LucideIcon
    iconColor?: string
    iconBgColor?: string
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    description?: string
    className?: string
    gradientColor?: string
}) {
    const { theme } = useTheme()

    const content = (
        <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-auto">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                        {title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {description}
                        </p>
                    )}
                </div>
                <IconBadge icon={Icon} variant={iconVariant} size="md" />
            </div>
        </CardContent>
    )

    if (theme === "dark") {
        return (
            <MagicCard
                className={cn("relative overflow-hidden rounded-lg border border-border bg-background h-full min-h-[140px]", className)}
                gradientFrom={gradientColor}
                gradientTo={`${gradientColor}80`}
                gradientSize={150}
            >
                {content}
            </MagicCard>
        )
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg border border-border bg-card h-full min-h-[140px]", className)}>
            {content}
        </div>
    )
}

// Gradient variant with shadow - Archive style
export function DashboardWidgetGradient({
    title,
    value,
    icon: Icon,
    iconVariant = 'default',
    gradientFrom,
    gradientTo,
    description,
    className,
}: {
    title: string
    value: string | number
    icon: LucideIcon
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    gradientFrom: string
    gradientTo: string
    description?: string
    className?: string
}) {
    const { theme } = useTheme()

    const content = (
        <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-auto">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                        {title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {description}
                        </p>
                    )}
                </div>
                <IconBadge icon={Icon} variant={iconVariant} size="md" />
            </div>
        </CardContent>
    )

    if (theme === "dark") {
        return (
            <MagicCard
                className={cn("relative overflow-hidden rounded-lg border border-border bg-background h-full min-h-[140px]", className)}
                gradientFrom={gradientFrom}
                gradientTo={gradientTo}
                gradientSize={150}
            >
                {content}
            </MagicCard>
        )
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg border border-border bg-card h-full min-h-[140px]", className)}>
            {content}
        </div>
    )
}

// Analytics widget with detailed breakdowns
interface StatBreakdown {
    label: string
    value: number
    percentage: number
    color: string
    badge?: {
        label: string
        color: string
    }
}

export function DashboardWidgetAnalytics({
    title,
    value,
    icon: Icon,
    iconVariant = 'default',
    gradientColor,
    breakdowns,
    trend,
    className,
}: {
    title: string
    value: string | number
    icon: LucideIcon
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    gradientColor: string
    breakdowns?: StatBreakdown[]
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    className?: string
}) {
    const { theme } = useTheme()
    const isPositive = trend ? trend.isPositive !== false : true

    const content = (
        <CardContent className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {title}
                    </h3>
                    <p className="text-3xl font-bold tracking-tight">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                </div>
                <IconBadge icon={Icon} variant={iconVariant} size="md" />
            </div>

            {/* Breakdowns */}
            {breakdowns && breakdowns.length > 0 && (
                <div className="space-y-3 mb-4">
                    {breakdowns.map((breakdown, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{breakdown.label}</span>
                                {breakdown.badge && (
                                    <span
                                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                                        style={{
                                            backgroundColor: breakdown.badge.color,
                                            color: "white"
                                        }}
                                    >
                                        {breakdown.badge.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-medium">{breakdown.value}</span>
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: breakdown.color }}
                                />
                                <span className="text-muted-foreground">
                                    ({breakdown.percentage}%)
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Progress bar */}
                    <div className="h-2 rounded-full overflow-hidden bg-muted flex">
                        {breakdowns.map((breakdown, index) => (
                            <div
                                key={index}
                                className="h-full"
                                style={{
                                    width: `${breakdown.percentage}%`,
                                    backgroundColor: breakdown.color
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Trend indicator */}
            {trend && (
                <div className="mt-auto pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                        <span
                            className={cn(
                                "flex items-center font-medium",
                                isPositive ? "text-emerald-600" : "text-red-600"
                            )}
                        >
                            {isPositive ? (
                                <TrendingUp className="h-4 w-4 me-1" />
                            ) : (
                                <TrendingDown className="h-4 w-4 me-1" />
                            )}
                            {Math.abs(trend.value).toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">{trend.label}</span>
                    </div>
                </div>
            )}
        </CardContent>
    )

    if (theme === "dark") {
        return (
            <MagicCard
                className={cn(
                    "relative overflow-hidden rounded-lg border border-border bg-background h-full",
                    className
                )}
                gradientFrom={gradientColor}
                gradientTo={`${gradientColor}80`}
                gradientSize={150}
            >
                {content}
            </MagicCard>
        )
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg border border-border bg-card h-full",
                className
            )}
        >
            {content}
        </div>
    )
}
