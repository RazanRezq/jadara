'use client'
import React from 'react'
import { JobDashboardWidget } from './job-widgets/job-dashboard-widget'
import { Users, Trophy, TrendingUp, Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslate } from '@/hooks/useTranslate'

interface ApplicantWidgetsProps {
    stats: {
        totalApplicants: number
        aiRecommended: number
        averageScore: number
        topMissingSkill?: string
    }
    loading?: boolean
}

export const ApplicantDashboardWidgets: React.FC<ApplicantWidgetsProps> = ({ stats, loading = false }) => {
    const { t } = useTranslate()

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-background">
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
                ))}
            </div>
        )
    }

    if (!stats) {
        return null
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Applicants */}
            <JobDashboardWidget
                title={t('applicants.stats.totalApplicants')}
                value={stats.totalApplicants}
                subtitle={stats.totalApplicants > 0 ? `+0% ${t('applicants.stats.lastWeek')}` : t('applicants.stats.noQualifiedCandidates')}
                icon={Inbox}
                iconVariant="primary"
            />

            {/* Best Candidates */}
            <JobDashboardWidget
                title={t('applicants.stats.bestCandidates')}
                value={stats.aiRecommended}
                subtitle={stats.aiRecommended > 0 ? `${stats.aiRecommended} ${t('applicants.stats.newApplicants')}` : t('applicants.stats.noQualifiedCandidates')}
                icon={Trophy}
                iconVariant="success"
            />

            {/* Average Match Rate */}
            <JobDashboardWidget
                title={t('applicants.stats.avgScore')}
                value={`${Math.round(stats.averageScore)}%`}
                subtitle={stats.averageScore > 0 ? `${stats.totalApplicants} ${t('applicants.stats.candidatesEvaluated')}` : t('applicants.stats.notEnoughMatchData')}
                icon={TrendingUp}
                iconVariant="info"
            />

            {/* AI Recommendations */}
            <JobDashboardWidget
                title={t('applicants.stats.aiRecommendations')}
                value={stats.aiRecommended}
                subtitle={stats.aiRecommended > 0 ? `${stats.aiRecommended} ${t('applicants.stats.highRatedApplicants')}` : t('applicants.stats.noRecommendationsAvailable')}
                icon={Users}
                iconVariant="warning"
            />
        </div>
    )
}
