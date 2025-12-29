"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useTranslate } from "@/hooks/useTranslate"
import { startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays } from "date-fns"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarEventBlock } from "./calendar-event-block"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarFilters } from "./calendar-filters"
import { EventDetailDialog } from "./event-detail-dialog"
import { CreateInterviewDialog } from "./create-interview-dialog"
import type { CalendarInterview, CalendarFilters as Filters, Job, Interviewer } from "./types"

interface CalendarClientProps {
  userRole: string
}

export function CalendarClient({ userRole }: CalendarClientProps) {
  const { t } = useTranslate()

  // View state
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Data state
  const [interviews, setInterviews] = useState<CalendarInterview[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [interviewers, setInterviewers] = useState<Interviewer[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    statuses: new Set(['scheduled', 'confirmed']),
    jobId: 'all',
    interviewerId: 'all',
    searchTerm: '',
  })

  // Dialog state
  const [selectedInterview, setSelectedInterview] = useState<CalendarInterview | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Authorization
  const canCreateInterview = userRole === 'admin' || userRole === 'superadmin'
  const canFilterByInterviewer = userRole === 'admin' || userRole === 'superadmin'

  // Fetch interviews for current month
  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true)

      // Calculate date range (current month ± 1 week)
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const start = subDays(monthStart, 7).toISOString()
      const end = addDays(monthEnd, 7).toISOString()

      // Build query params
      const params = new URLSearchParams({
        start,
        end,
      })

      if (filters.statuses.size > 0 && filters.statuses.size < 6) {
        params.append('status', Array.from(filters.statuses).join(','))
      }
      if (filters.jobId !== 'all') {
        params.append('jobId', filters.jobId)
      }
      if (filters.interviewerId !== 'all') {
        params.append('scheduledBy', filters.interviewerId)
      }
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm)
      }

      const response = await fetch(`/api/interviews/by-date-range?${params}`)
      const data = await response.json()

      if (data.success) {
        setInterviews(data.interviews)
      } else {
        toast.error(data.error || t("calendar.errorLoadingInterviews"))
      }
    } catch (error) {
      toast.error(t("calendar.errorLoadingInterviews"))
    } finally {
      setLoading(false)
    }
  }, [currentDate, filters, t])

  // Fetch jobs list (once)
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs/list')
      const data = await response.json()
      if (data.success) {
        setJobs(
          data.jobs.map((job: any) => ({
            id: job._id || job.id,
            title: job.title,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }, [])

  // Fetch interviewers (admin+ only, once)
  const fetchInterviewers = useCallback(async () => {
    if (!canFilterByInterviewer) return

    try {
      const response = await fetch('/api/users/list?role=admin')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setInterviewers(
          data.users.map((user: any) => ({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch interviewers:', error)
    }
  }, [canFilterByInterviewer])

  // Initial data fetch
  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  // Fetch jobs and interviewers once on mount
  useEffect(() => {
    fetchJobs()
    fetchInterviewers()
  }, [fetchJobs, fetchInterviewers])

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Event handlers
  const handleDayClick = (date: Date) => {
    if (canCreateInterview) {
      setSelectedDate(date)
      setCreateDialogOpen(true)
    }
  }

  const handleEventClick = (interview: CalendarInterview) => {
    setSelectedInterview(interview)
    setDetailDialogOpen(true)
  }

  const handleCreateInterview = () => {
    if (canCreateInterview) {
      setSelectedDate(new Date())
      setCreateDialogOpen(true)
    }
  }

  const handleInterviewUpdated = () => {
    fetchInterviews()
  }

  // Filter handlers
  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  if (loading && interviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Spinner className="h-8 w-8" />
        <p className="ms-3 text-muted-foreground">{t("calendar.loading")}</p>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CalendarToolbar
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onCreateInterview={handleCreateInterview}
        canCreateInterview={canCreateInterview}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        FiltersComponent={(props) => (
          <CalendarFilters
            {...props}
            jobs={jobs}
            interviewers={interviewers}
            canFilterByInterviewer={canFilterByInterviewer}
          />
        )}
      />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <CalendarMonthView
            currentDate={currentDate}
            interviews={interviews}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            canCreateInterview={canCreateInterview}
            EventBlock={CalendarEventBlock}
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        interview={selectedInterview}
        onInterviewUpdated={handleInterviewUpdated}
        canEdit={canCreateInterview}
      />

      {/* Create Interview Dialog */}
      <CreateInterviewDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedDate={selectedDate}
        onInterviewCreated={handleInterviewUpdated}
      />
    </Card>
  )
}
