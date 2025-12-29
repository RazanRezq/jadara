"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Calendar, Clock, Video, User, Briefcase, Mail, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import type { CalendarInterview } from "./types"

interface EventDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: CalendarInterview | null
  onInterviewUpdated: () => void
  canEdit: boolean
}

export function EventDetailDialog({
  open,
  onOpenChange,
  interview,
  onInterviewUpdated,
  canEdit,
}: EventDetailDialogProps) {
  const { t, locale } = useTranslate()
  const dateLocale = locale === "ar" ? ar : enUS

  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  if (!interview) return null

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500",
    confirmed: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
    no_show: "bg-orange-500",
    rescheduled: "bg-purple-500",
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/interviews/cancel/${interview.id}`, {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast.success(t("calendar.event.cancelSuccess"))
        onInterviewUpdated()
        onOpenChange(false)
        setCancelDialogOpen(false)
      } else {
        toast.error(data.error || "Failed to cancel interview")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/interviews/update/${interview.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(t("calendar.event.statusUpdated"))
        onInterviewUpdated()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkNoShow = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/interviews/update/${interview.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "no_show" }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(t("calendar.event.statusUpdated"))
        onInterviewUpdated()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{t("calendar.event.details")}</DialogTitle>
              <Badge className={statusColors[interview.status]}>
                {t(`calendar.status.${interview.status}`)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Candidate Info */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("calendar.event.candidateInfo")}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{interview.applicantName}</p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {interview.applicantEmail}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-3 w-3" />
                  {interview.jobTitle}
                </p>
              </div>
            </div>

            <Separator />

            {/* Interview Info */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("calendar.event.interviewInfo")}
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{t("applicants.interview.date")}:</span>{" "}
                  {format(new Date(interview.scheduledDate), "PPP", { locale: dateLocale })}
                </p>
                <p>
                  <span className="font-medium">{t("applicants.interview.time")}:</span>{" "}
                  {interview.scheduledTime}
                </p>
                <p>
                  <span className="font-medium">{t("applicants.interview.duration")}:</span>{" "}
                  {interview.duration} minutes
                </p>
                <p>
                  <span className="font-medium">{t("calendar.event.scheduledBy")}:</span>{" "}
                  {interview.scheduledBy.name}
                </p>
              </div>
            </div>

            <Separator />

            {/* Meeting Details */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-4 w-4" />
                {t("calendar.event.meetingDetails")}
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{t("applicants.interview.meetingLink")}:</span>
                </p>
                <a
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {interview.meetingLink}
                </a>
              </div>
            </div>

            {interview.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("applicants.interview.notes")}</h3>
                  <p className="text-sm text-muted-foreground">{interview.notes}</p>
                </div>
              </>
            )}

            {interview.internalNotes && canEdit && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("calendar.event.internalNotes")}</h3>
                  <p className="text-sm text-muted-foreground">{interview.internalNotes}</p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {canEdit && interview.status !== "cancelled" && interview.status !== "completed" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleMarkComplete}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t("calendar.event.markComplete")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMarkNoShow}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t("calendar.event.markNoShow")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading}
                >
                  {t("calendar.event.cancel")}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.event.cancel")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("calendar.event.confirmCancel")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
