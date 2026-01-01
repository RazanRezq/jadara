"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MagicCard } from "@/components/magicui/magic-card"
import { IconBadge } from "@/components/ui/icon-badge"
import { cn } from "@/lib/utils"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatBreakdown {
    label: string
    value: number
    percentage: number
    color: string
}

interface AnalyticsCardWithChartProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    gradientColor?: string
    gradientFrom?: string
    gradientTo?: string
    breakdowns: StatBreakdown[]
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    className?: string
    chartType?: 'donut' | 'bar'
}

export function AnalyticsCardWithChart({
    title,
    value,
    icon: Icon,
    iconVariant = 'default',
    gradientColor,
    gradientFrom,
    gradientTo,
    breakdowns,
    trend,
    className,
    chartType = 'donut'
}: AnalyticsCardWithChartProps) {
    const isPositive = trend ? trend.isPositive !== false : true

    // Use gradientFrom/To if provided, otherwise fallback to gradientColor (legacy support)
    const finalGradientFrom = gradientFrom || gradientColor || "#4f46e5"
    const finalGradientTo = gradientTo || (gradientColor ? `${gradientColor}80` : "#7c3aed")

    // Calculate donut chart segments with memoization
    const donutSegments = useMemo(() => {
        if (chartType !== 'donut' || !breakdowns || breakdowns.length === 0) {
            return { segments: [], hasData: false }
        }

        // Check if all values are 0
        const hasData = breakdowns.some(b => b.value > 0)

        let currentAngle = -90 // Start from top

        // If no data, show equal segments as placeholder
        const itemsToRender = hasData
            ? breakdowns.filter(breakdown => breakdown.percentage > 0)
            : breakdowns.map(b => ({ ...b, percentage: 100 / breakdowns.length }))

        const segments = itemsToRender.map((breakdown) => {
                const angle = (breakdown.percentage / 100) * 360
                const startAngle = currentAngle
                const endAngle = currentAngle + angle
                currentAngle = endAngle

                // Convert angles to radians
                const startRad = (startAngle * Math.PI) / 180
                const endRad = (endAngle * Math.PI) / 180

                // Calculate arc path
                const radius = 40
                const innerRadius = 28
                const centerX = 50
                const centerY = 50

                const x1 = centerX + radius * Math.cos(startRad)
                const y1 = centerY + radius * Math.sin(startRad)
                const x2 = centerX + radius * Math.cos(endRad)
                const y2 = centerY + radius * Math.sin(endRad)
                const x3 = centerX + innerRadius * Math.cos(endRad)
                const y3 = centerY + innerRadius * Math.sin(endRad)
                const x4 = centerX + innerRadius * Math.cos(startRad)
                const y4 = centerY + innerRadius * Math.sin(startRad)

                const largeArc = angle > 180 ? 1 : 0

                const path = `
                    M ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                    L ${x3} ${y3}
                    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
                    Z
                `

                return {
                    path,
                    color: breakdown.color,
                    label: breakdown.label,
                    value: breakdown.value,
                    percentage: breakdown.percentage
                }
            })

        return { segments, hasData }
    }, [chartType, breakdowns])

    const content = (
        <CardContent className="p-6 h-full flex flex-col">
            {/* Header with Icon */}
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

            {/* Chart and Breakdowns Section */}
            <div className="flex-1 flex gap-6 items-center">
                {/* Chart */}
                {chartType === 'donut' && breakdowns && breakdowns.length > 0 && (
                    <div className="flex-shrink-0">
                        <svg
                            width="100"
                            height="100"
                            viewBox="0 0 100 100"
                            className="transform -rotate-0"
                        >
                            {donutSegments.segments.length > 0 ? (
                                donutSegments.segments.map((segment, index) => (
                                    <path
                                        key={`${segment.label}-${index}`}
                                        d={segment.path}
                                        fill={segment.color}
                                        className="transition-opacity hover:opacity-80"
                                        opacity={donutSegments.hasData ? 1 : 0.5}
                                    />
                                ))
                            ) : (
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    className="text-muted-foreground/20"
                                />
                            )}
                        </svg>
                    </div>
                )}

                {/* Breakdowns List */}
                <div className="flex-1 space-y-2.5">
                    {breakdowns.map((breakdown, index) => (
                        <div key={index} className="flex items-center justify-between text-sm group">
                            <div className="flex items-center gap-2 flex-1">
                                <span
                                    className="w-3 h-3 rounded-sm flex-shrink-0 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: breakdown.color }}
                                />
                                <span className="text-muted-foreground truncate">
                                    {breakdown.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ms-2">
                                <span className="font-semibold text-foreground">
                                    {breakdown.value}
                                </span>
                                <span className="text-xs text-muted-foreground min-w-[3rem] text-end">
                                    {breakdown.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                        <span
                            className={cn(
                                "flex items-center font-medium",
                                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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

    // Render card with MagicCard hover effect
    return (
        <MagicCard
            className={cn(
                "relative overflow-hidden rounded-lg border border-border bg-background h-full min-h-[280px]",
                className
            )}
            gradientFrom={finalGradientFrom}
            gradientTo={finalGradientTo}
            gradientSize={150}
        >
            {content}
        </MagicCard>
    )
}
