"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import { ApplicantSearchCombobox } from "./applicant-search-combobox"
import { ScheduleInterviewDialog } from "@/app/(dashboard)/dashboard/applicants/_components/schedule-interview-dialog"

interface CreateInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date | null
  onInterviewCreated: () => void
}

export function CreateInterviewDialog({
  open,
  onOpenChange,
  selectedDate,
  onInterviewCreated,
}: CreateInterviewDialogProps) {
  const { t, isRTL } = useTranslate()

  const [selectedApplicant, setSelectedApplicant] = useState<{
    id: string
    name: string
    email: string
    jobId: string
    jobTitle: string
  } | null>(null)

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedApplicant(null)
    }
  }, [open])

  const handleApplicantSelect = (applicant: any) => {
    setSelectedApplicant(applicant)
    // Automatically open schedule dialog when applicant is selected
    setScheduleDialogOpen(true)
    onOpenChange(false)
  }

  const handleScheduleSuccess = () => {
    onInterviewCreated()
    setSelectedApplicant(null)
    setScheduleDialogOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("calendar.createInterview")}</DialogTitle>
            <DialogDescription>
              {t("calendar.selectApplicant")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label>{t("applicants.candidate")}</Label>
              <ApplicantSearchCombobox
                value={selectedApplicant?.id || ""}
                onSelect={handleApplicantSelect}
              />
              <p className="text-xs text-muted-foreground">
                {t("calendar.searchApplicants")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      {selectedApplicant && (
        <ScheduleInterviewDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          applicantId={selectedApplicant.id}
          jobId={selectedApplicant.jobId}
          applicantName={selectedApplicant.name}
          applicantEmail={selectedApplicant.email}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </>
  )
}
