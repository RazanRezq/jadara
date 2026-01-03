"use client"

import { useMemo } from "react"
import { isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useTranslate } from "@/hooks/useTranslate"
import type { CalendarInterview, CalendarDay } from "./types"

interface CalendarMonthViewProps {
  currentDate: Date
  interviews: CalendarInterview[]
  onDayClick: (date: Date) => void
  onEventClick: (interview: CalendarInterview) => void
  canCreateInterview: boolean
  EventBlock: React.ComponentType<{
    interview: CalendarInterview
    onClick: () => void
  }>
  highlightedDate?: Date | null
}

function generateCalendarDays(
  currentDate: Date,
  interviews: CalendarInterview[]
): CalendarDay[] {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return days.map((date) => {
    const dayInterviews = interviews.filter((interview) =>
      isSameDay(new Date(interview.scheduledDate), date)
    )

    return {
      date,
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      isToday: isToday(date),
      interviews: dayInterviews.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    }
  })
}

export function CalendarMonthView({
  currentDate,
  interviews,
  onDayClick,
  onEventClick,
  canCreateInterview,
  EventBlock,
  highlightedDate,
}: CalendarMonthViewProps) {
  const { t, locale, isRTL } = useTranslate()

  const calendarDays = useMemo(
    () => generateCalendarDays(currentDate, interviews),
    [currentDate, interviews]
  )

  const dateLocale = locale === "ar" ? ar : enUS
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end: new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000) }).map(
      (day) => format(day, "EEE", { locale: dateLocale })
    )
  }, [dateLocale])

  const MAX_VISIBLE_EVENTS = 3

  return (
    <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* Week day headers - hidden on mobile */}
      <div className="hidden md:grid grid-cols-7 border-b border-border bg-muted/50">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - hidden on mobile, shown on tablets and up */}
      <div className="hidden md:grid grid-cols-7 flex-1 border-t border-border">
        {calendarDays.map((day, index) => {
          const visibleEvents = day.interviews.slice(0, MAX_VISIBLE_EVENTS)
          const hiddenCount = day.interviews.length - MAX_VISIBLE_EVENTS
          const isHighlighted = highlightedDate && isSameDay(day.date, highlightedDate)

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] md:min-h-[120px] border-b border-r border-border p-1.5 md:p-2 transition-all duration-300",
                !day.isCurrentMonth && "bg-muted/20",
                day.isToday && "bg-primary/5",
                isHighlighted && "bg-amber-50 dark:bg-amber-950/20 ring-2 ring-amber-400 dark:ring-amber-600 animate-pulse-glow",
                canCreateInterview && "cursor-pointer hover:bg-muted",
                (index + 1) % 7 === 0 && "border-r-0"
              )}
              onClick={() => {
                if (canCreateInterview && day.isCurrentMonth) {
                  onDayClick(day.date)
                }
              }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !day.isCurrentMonth && "text-muted-foreground",
                    day.isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground",
                    isHighlighted && !day.isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold"
                  )}
                >
                  {format(day.date, "d")}
                </span>
              </div>

              {/* Event blocks */}
              <div className="space-y-1">
                {visibleEvents.map((interview) => (
                  <div
                    key={interview.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(interview)
                    }}
                  >
                    <EventBlock interview={interview} onClick={() => onEventClick(interview)} />
                  </div>
                ))}

                {/* Show more button */}
                {hiddenCount > 0 && (
                  <button
                    className="w-full text-xs text-primary hover:underline text-start px-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open day view dialog with all events
                    }}
                  >
                    {t("calendar.moreEvents", { count: hiddenCount })}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile list view - shown on mobile, hidden on tablets and up */}
      <div className="md:hidden space-y-4 p-4 overflow-y-auto">
        {calendarDays
          .filter((day) => day.isCurrentMonth && day.interviews.length > 0)
          .map((day, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">
                {format(day.date, "EEEE, MMMM d", { locale: dateLocale })}
              </h3>
              <div className="space-y-2">
                {day.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    onClick={() => onEventClick(interview)}
                    className="cursor-pointer"
                  >
                    <EventBlock interview={interview} onClick={() => onEventClick(interview)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        {calendarDays.filter((day) => day.isCurrentMonth && day.interviews.length > 0).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("calendar.noInterviews")}</p>
            <p className="text-sm mt-1">{t("calendar.noInterviewsDescription")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
