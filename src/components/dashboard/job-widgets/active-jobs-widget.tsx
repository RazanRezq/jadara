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
            <div className="space-y-3 rounded-lg border p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-3 w-full" />
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
