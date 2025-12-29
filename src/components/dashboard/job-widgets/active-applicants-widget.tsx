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
            <div className="space-y-3 rounded-lg border p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-16 w-full mt-2" />
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
