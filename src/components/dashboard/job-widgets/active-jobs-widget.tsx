'use client'
import React from 'react'
import { JobDashboardWidget } from './job-dashboard-widget'
import { Briefcase } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslate } from '@/hooks/useTranslate'

interface ActiveJobsWidgetProps {
    data: {
        count: number
        topDepartments: string[]
    } | null
    loading?: boolean
}

export const ActiveJobsWidget: React.FC<ActiveJobsWidgetProps> = ({ data, loading }) => {
    const { t } = useTranslate()

    if (loading) {
        return (
            <div className="rounded-lg border border-border bg-background">
                {/* CardHeader skeleton */}
                <div className="px-6 pt-6 pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-9 w-16" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </div>
                {/* CardContent skeleton */}
                <div className="px-6 pb-6">
                    <div className="h-4" />
                </div>
            </div>
        )
    }

    if (!data) {
        return null
    }

    const departmentsText = data.topDepartments.length > 0
        ? data.topDepartments.join(', ')
        : t('jobs.widgets.noDepartments')

    return (
        <JobDashboardWidget
            title={t('jobs.widgets.activeJobs')}
            value={data.count}
            subtitle={departmentsText}
            icon={Briefcase}
            iconVariant="info"
        />
    )
}
