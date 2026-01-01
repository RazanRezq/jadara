'use client'
import React from 'react'
import { JobDashboardWidget } from './job-dashboard-widget'
import { FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslate } from '@/hooks/useTranslate'

interface TotalApplicationsWidgetProps {
    data: {
        total: number
        change: number
        label: string
        chartData: number[]
    } | null
    loading?: boolean
}

export const TotalApplicationsWidget: React.FC<TotalApplicationsWidgetProps> = ({ data, loading }) => {
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

    return (
        <JobDashboardWidget
            title={t('jobs.widgets.totalApplications')}
            value={data.total.toLocaleString()}
            trend={{
                value: data.change,
                label: t('jobs.widgets.lastWeek'),
                isPositive: data.change >= 0,
            }}
            icon={FileText}
            iconVariant="primary"
            chartData={data.chartData}
        />
    )
}
