'use client'
import React from 'react'
import { JobDashboardWidget } from './job-dashboard-widget'
import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslate } from '@/hooks/useTranslate'

interface ActiveApplicantsWidgetProps {
    data: {
        total: number
        newThisWeek: number
        chartData: number[]
    } | null
    loading?: boolean
}

export const ActiveApplicantsWidget: React.FC<ActiveApplicantsWidgetProps> = ({ data, loading }) => {
    const { t } = useTranslate()

    if (loading) {
        return (
            <div className="rounded-lg border border-border bg-background">
                {/* CardHeader skeleton */}
                <div className="px-6 pt-6 pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-9 w-20" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </div>
                {/* CardContent skeleton */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-12 w-full mt-2" />
                    </div>
                </div>
            </div>
        )
    }

    if (!data) {
        return null
    }

    const changePercent = data.total > 0
        ? ((data.newThisWeek / data.total) * 100).toFixed(1)
        : 0

    return (
        <JobDashboardWidget
            title={t('jobs.widgets.activeApplicants')}
            value={data.total.toLocaleString()}
            trend={{
                value: Number(changePercent),
                label: t('jobs.widgets.newThisWeek'),
                isPositive: data.newThisWeek >= 0,
            }}
            icon={Users}
            iconVariant="success"
            chartData={data.chartData}
        />
    )
}
