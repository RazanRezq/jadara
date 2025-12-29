"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, CalendarIcon, Filter, Plus } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useTranslate } from "@/hooks/useTranslate"
import type { CalendarFilters } from "./types"

interface CalendarToolbarProps {
  currentDate: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onCreateInterview?: () => void
  canCreateInterview: boolean
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
  FiltersComponent: React.ComponentType<{
    filters: CalendarFilters
    onFiltersChange: (filters: CalendarFilters) => void
  }>
}

export function CalendarToolbar({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreateInterview,
  canCreateInterview,
  filters,
  onFiltersChange,
  FiltersComponent,
}: CalendarToolbarProps) {
  const { t, locale, isRTL } = useTranslate()
  const dateLocale = locale === "ar" ? ar : enUS

  // Count active filters
  const activeFilterCount =
    (filters.statuses.size > 0 && filters.statuses.size < 6 ? 1 : 0) +
    (filters.jobId !== 'all' ? 1 : 0) +
    (filters.interviewerId !== 'all' ? 1 : 0) +
    (filters.searchTerm ? 1 : 0)

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left: Month navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousMonth}
            className={cn(isRTL && "rotate-180")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            className={cn(isRTL && "rotate-180")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={onToday}>
          {t("calendar.today")}
        </Button>
      </div>

      {/* Right: Filters and actions */}
      <div className="flex items-center gap-2">
        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("calendar.filters.title")}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align={isRTL ? "start" : "end"}>
            <FiltersComponent filters={filters} onFiltersChange={onFiltersChange} />
          </PopoverContent>
        </Popover>

        {/* Create interview button */}
        {canCreateInterview && onCreateInterview && (
          <Button onClick={onCreateInterview} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("calendar.createInterview")}
          </Button>
        )}
      </div>
    </div>
  )
}

// Helper function for className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
