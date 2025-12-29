'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { TotalApplicationsWidget } from './total-applications-widget'
import { ActiveJobsWidget } from './active-jobs-widget'
import { InterviewsScheduledWidget } from './interviews-scheduled-widget'
import { ActiveApplicantsWidget } from './active-applicants-widget'

export const JobDashboardWidgets: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [widgetData, setWidgetData] = useState<any>({
        applications: null,
        jobs: null,
        interviews: null,
        applicants: null,
    })

    const fetchWidgetData = useCallback(async () => {
        setLoading(true)
        try {
            console.log('Fetching dashboard widgets...')
            const response = await fetch('/api/jobs/dashboard-widgets')
            console.log('Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('API Error:', response.status, errorText)
                throw new Error(`API returned ${response.status}`)
            }

            const data = await response.json()
            console.log('Widget data received:', data)

            if (data.success) {
                setWidgetData(data.widgets)
            } else {
                console.error('API returned success=false:', data.error)
            }
        } catch (error) {
            console.error('Error fetching widget data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWidgetData()
    }, [fetchWidgetData])

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <TotalApplicationsWidget
                data={widgetData.applications}
                loading={loading}
            />
            <ActiveJobsWidget
                data={widgetData.jobs}
                loading={loading}
            />
            <InterviewsScheduledWidget
                data={widgetData.interviews}
                loading={loading}
            />
            <ActiveApplicantsWidget
                data={widgetData.applicants}
                loading={loading}
            />
        </div>
    )
}
