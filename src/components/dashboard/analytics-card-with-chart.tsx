"use client"

import { useMemo } from "react"
import { CardContent } from "@/components/ui/card"
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
                const innerRadius = 26
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
        <CardContent className="p-5 h-full flex flex-col">
            {/* Header with Icon */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {title}
                    </h3>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                </div>
                <IconBadge icon={Icon} variant={iconVariant} size="sm" />
            </div>

            {/* Chart and Breakdowns Section */}
            <div className="flex-1 flex gap-3 items-center mt-2">
                {/* Chart */}
                {chartType === 'donut' && breakdowns && breakdowns.length > 0 && (
                    <div className="flex-shrink-0 relative">
                        <svg
                            width="56"
                            height="56"
                            viewBox="0 0 100 100"
                            className="drop-shadow-sm"
                        >
                            {donutSegments.segments.length > 0 ? (
                                donutSegments.segments.map((segment, index) => (
                                    <path
                                        key={`${segment.label}-${index}`}
                                        d={segment.path}
                                        fill={segment.color}
                                        className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                                        opacity={donutSegments.hasData ? 1 : 0.4}
                                        style={{
                                            filter: donutSegments.hasData ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none'
                                        }}
                                    />
                                ))
                            ) : (
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    className="text-muted-foreground/15"
                                />
                            )}
                        </svg>
                    </div>
                )}

                {/* Breakdowns List */}
                <div className="flex-1 min-w-0 space-y-1">
                    {breakdowns.map((breakdown, index) => (
                        <div 
                            key={index} 
                            className="flex items-center gap-2 py-0.5 rounded-md transition-colors hover:bg-muted/50 px-1 -mx-1 cursor-default group"
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/20 transition-transform group-hover:scale-125"
                                style={{ backgroundColor: breakdown.color }}
                            />
                            <span className="text-[11px] text-muted-foreground flex-1 min-w-0 truncate group-hover:text-foreground transition-colors">
                                {breakdown.label}
                            </span>
                            <span className="text-[11px] font-semibold text-foreground flex-shrink-0 tabular-nums">
                                {breakdown.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs">
                        <span
                            className={cn(
                                "flex items-center font-medium px-1.5 py-0.5 rounded-md",
                                isPositive 
                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" 
                                    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50"
                            )}
                        >
                            {isPositive ? (
                                <TrendingUp className="h-3 w-3 me-0.5" />
                            ) : (
                                <TrendingDown className="h-3 w-3 me-0.5" />
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
                "relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm h-full min-h-[220px]",
                "shadow-sm hover:shadow-md transition-shadow duration-300",
                className
            )}
            gradientFrom={finalGradientFrom}
            gradientTo={finalGradientTo}
            gradientSize={120}
        >
            {content}
        </MagicCard>
    )
}
