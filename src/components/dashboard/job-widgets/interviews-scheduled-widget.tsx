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
            <div className="rounded-lg border border-border bg-background">
                {/* CardHeader skeleton */}
                <div className="px-6 pt-6 pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-9 w-16" />
                            <Skeleton className="h-3 w-40" />
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
