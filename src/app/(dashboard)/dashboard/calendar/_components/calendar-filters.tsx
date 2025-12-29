"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"
import type { CalendarFilters, InterviewStatus, Job, Interviewer } from "./types"

interface CalendarFiltersProps {
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
  jobs?: Job[]
  interviewers?: Interviewer[]
  canFilterByInterviewer?: boolean
}

const allStatuses: InterviewStatus[] = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled',
]

export function CalendarFilters({
  filters,
  onFiltersChange,
  jobs = [],
  interviewers = [],
  canFilterByInterviewer = false,
}: CalendarFiltersProps) {
  const { t, isRTL } = useTranslate()
  const [localFilters, setLocalFilters] = useState(filters)

  // Update local state when external filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleStatusToggle = (status: InterviewStatus) => {
    const newStatuses = new Set(localFilters.statuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    const updated = { ...localFilters, statuses: newStatuses }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const handleJobChange = (jobId: string) => {
    const updated = { ...localFilters, jobId }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const handleInterviewerChange = (interviewerId: string) => {
    const updated = { ...localFilters, interviewerId }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const handleSearchChange = (searchTerm: string) => {
    const updated = { ...localFilters, searchTerm }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const handleClearAll = () => {
    const cleared: CalendarFilters = {
      statuses: new Set(['scheduled', 'confirmed']),
      jobId: 'all',
      interviewerId: 'all',
      searchTerm: '',
    }
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{t("calendar.filters.title")}</h3>
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          <X className="h-4 w-4 me-1" />
          {t("calendar.filters.clearAll")}
        </Button>
      </div>

      {/* Search by candidate */}
      <div className="space-y-2">
        <Label>{t("calendar.filters.search")}</Label>
        <div className="relative">
          <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("calendar.searchApplicants")}
            value={localFilters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-8"
          />
        </div>
      </div>

      {/* Status multi-select */}
      <div className="space-y-2">
        <Label>{t("calendar.filters.status")}</Label>
        <div className="space-y-2">
          {allStatuses.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                id={`status-${status}`}
                checked={localFilters.statuses.has(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm cursor-pointer select-none"
              >
                {t(`calendar.status.${status}`)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Job filter */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <Label>{t("calendar.filters.job")}</Label>
          <Select value={localFilters.jobId} onValueChange={handleJobChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("calendar.filters.allJobs")}</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Interviewer filter (admin+ only) */}
      {canFilterByInterviewer && interviewers.length > 0 && (
        <div className="space-y-2">
          <Label>{t("calendar.filters.interviewer")}</Label>
          <Select value={localFilters.interviewerId} onValueChange={handleInterviewerChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("calendar.filters.allInterviewers")}</SelectItem>
              {interviewers.map((interviewer) => (
                <SelectItem key={interviewer.id} value={interviewer.id}>
                  {interviewer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
