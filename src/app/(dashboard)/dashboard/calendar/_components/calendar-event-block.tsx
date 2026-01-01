"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import type { CalendarInterview, InterviewStatus } from "./types"

interface CalendarEventBlockProps {
  interview: CalendarInterview
  onClick: () => void
}

const statusColors: Record<InterviewStatus, { borderColor: string; bgColor: string; bgHoverColor: string }> = {
  scheduled: {
    borderColor: "#3B82F6", // blue-500
    bgColor: "rgba(59, 130, 246, 0.1)",
    bgHoverColor: "rgba(59, 130, 246, 0.2)",
  },
  confirmed: {
    borderColor: "#22C55E", // green-500
    bgColor: "rgba(34, 197, 94, 0.1)",
    bgHoverColor: "rgba(34, 197, 94, 0.2)",
  },
  completed: {
    borderColor: "#64748B", // gray-500
    bgColor: "rgba(100, 116, 139, 0.1)",
    bgHoverColor: "rgba(100, 116, 139, 0.2)",
  },
  cancelled: {
    borderColor: "#EF4444", // red-500
    bgColor: "rgba(239, 68, 68, 0.1)",
    bgHoverColor: "rgba(239, 68, 68, 0.2)",
  },
  no_show: {
    borderColor: "#9ca3af", // gray-400
    bgColor: "rgba(249, 115, 22, 0.1)",
    bgHoverColor: "rgba(249, 115, 22, 0.2)",
  },
  rescheduled: {
    borderColor: "#A855F7", // purple-500
    bgColor: "rgba(168, 85, 247, 0.1)",
    bgHoverColor: "rgba(168, 85, 247, 0.2)",
  },
}

export function CalendarEventBlock({ interview, onClick }: CalendarEventBlockProps) {
  const { t, locale } = useTranslate()
  const dateLocale = locale === "ar" ? ar : enUS

  const colors = statusColors[interview.status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="border-l-2 p-1 mb-1 rounded text-xs cursor-pointer transition-all"
            style={{
              borderLeftColor: colors.borderColor,
              backgroundColor: colors.bgColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgHoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgColor
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <div className="font-medium truncate">{interview.applicantName}</div>
            <div className="text-[10px] opacity-80">
              {interview.scheduledTime} ({interview.duration}min)
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">{interview.applicantName}</div>
            <div className="text-muted-foreground">{interview.jobTitle}</div>
            <div className="border-t pt-1 mt-1">
              <div>
                <span className="font-medium">{t("applicants.interview.time")}:</span>{" "}
                {interview.scheduledTime}
              </div>
              <div>
                <span className="font-medium">{t("applicants.interview.duration")}:</span>{" "}
                {interview.duration} {t("common.minutes") || "minutes"}
              </div>
              <div>
                <span className="font-medium">{t("common.status")}:</span>{" "}
                {t(`calendar.status.${interview.status}`)}
              </div>
            </div>
            {interview.notes && (
              <div className="border-t pt-1 mt-1">
                <div className="font-medium">{t("applicants.interview.notes")}:</div>
                <div className="text-muted-foreground line-clamp-2">{interview.notes}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
