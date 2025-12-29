'use client'
import React from 'react'
import { JobDashboardWidget } from './job-dashboard-widget'
import { Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslate } from '@/hooks/useTranslate'

interface InterviewsScheduledWidgetProps {
    data: {
        count: number
        nextInterview?: {
            candidateName: string
            time: string
        }
    } | null
    loading?: boolean
}

export const InterviewsScheduledWidget: React.FC<InterviewsScheduledWidgetProps> = ({ data, loading }) => {
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

    return (
        <JobDashboardWidget
            title={t('jobs.widgets.interviewsScheduled')}
            value={data.count}
            subtitle={
                data.nextInterview
                    ? data.nextInterview.candidateName
                    : t('jobs.widgets.noUpcomingInterviews')
            }
            icon={Calendar}
            iconVariant="warning"
        />
    )
}
