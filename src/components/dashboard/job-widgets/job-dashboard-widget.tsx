import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MagicCard } from '@/components/magicui/magic-card'
import { IconBadge } from '@/components/ui/icon-badge'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper to check if chart data has meaningful variation (not all same values)
const hasVariation = (data: number[]): boolean => {
    if (data.length < 2) return false
    const first = data[0]
    return data.some(value => value !== first)
}

interface JobDashboardWidgetProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    icon?: LucideIcon
    iconVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    chartData?: number[]
    className?: string
    children?: React.ReactNode
}

export const JobDashboardWidget: React.FC<JobDashboardWidgetProps> = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    iconVariant = 'primary',
    chartData,
    className,
    children,
}) => {
    // Map iconVariant to gradient colors (hex format for MagicCard)
    const variantToGradient = {
        'default': { from: '#64748b', to: '#6b7280' },      // slate to gray
        'primary': { from: '#3b82f6', to: '#6366f1' },      // blue to indigo
        'success': { from: '#22c55e', to: '#10b981' },      // green to emerald
        'warning': { from: '#e5e7eb', to: '#f3f4f6' },      // gray-200 to gray-100
        'danger': { from: '#ef4444', to: '#f43f5e' },       // red to rose
        'info': { from: '#06b6d4', to: '#14b8a6' },         // cyan to teal
    } as const

    const gradient = variantToGradient[iconVariant]

    return (
        <MagicCard
            className={cn('relative overflow-hidden rounded-lg border border-border bg-background', className)}
            gradientFrom={gradient.from}
            gradientTo={gradient.to}
            gradientSize={150}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            {title}
                        </h3>
                        <div className="text-3xl font-bold">{value}</div>
                        {subtitle && (
                            <div className="text-xs text-muted-foreground mt-1">
                                {subtitle}
                            </div>
                        )}
                    </div>
                    {icon && (
                        <IconBadge icon={icon} variant={iconVariant} size="md" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex flex-col gap-2">
                    {trend && (
                        <div className="flex items-center gap-1">
                            {trend.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                )}
                            >
                                {trend.isPositive ? '+' : ''}
                                {trend.value}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {trend.label}
                            </span>
                        </div>
                    )}
                    {chartData && chartData.length > 0 && hasVariation(chartData) && (
                        <div className="mt-2">
                            <MiniLineChart data={chartData} />
                        </div>
                    )}
                    {children}
                </div>
            </CardContent>
        </MagicCard>
    )
}

// Simple mini line chart component
const MiniLineChart: React.FC<{ data: number[] }> = ({ data }) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
    })

    return (
        <svg
            className="h-12 w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={points.join(' ')}
                className="text-primary opacity-70"
            />
        </svg>
    )
}
