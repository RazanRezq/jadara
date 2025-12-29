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
