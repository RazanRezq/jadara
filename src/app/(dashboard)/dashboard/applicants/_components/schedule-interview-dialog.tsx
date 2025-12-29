"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, Video, Mail, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"

interface ScheduleInterviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicantId: string
    jobId: string
    applicantName: string
    applicantEmail: string
    onSuccess: () => void
    existingInterview?: {
        id?: string
        scheduledDate: string
        scheduledTime: string
        duration: number
        meetingLink: string
        notes?: string
    }
}

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
]

const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
]

export function ScheduleInterviewDialog({
    open,
    onOpenChange,
    applicantId,
    jobId,
    applicantName,
    applicantEmail,
    onSuccess,
    existingInterview,
}: ScheduleInterviewDialogProps) {
    const { t, dir } = useTranslate()
    const [submitting, setSubmitting] = useState(false)
    const [date, setDate] = useState<Date>()
    const [time, setTime] = useState<string>("")
    const [duration, setDuration] = useState<number>(60)
    const [meetingLink, setMeetingLink] = useState("")
    const [notes, setNotes] = useState("")
    const [sendEmail, setSendEmail] = useState(true)
    const [errors, setErrors] = useState<{
        date?: string
        time?: string
        meetingLink?: string
    }>({})

    // Load existing interview data when dialog opens
    useEffect(() => {
        if (open && existingInterview) {
            setDate(new Date(existingInterview.scheduledDate))
            setTime(existingInterview.scheduledTime)
            setDuration(existingInterview.duration)
            setMeetingLink(existingInterview.meetingLink)
            setNotes(existingInterview.notes || "")
            setErrors({})
        } else if (!open) {
            // Reset form when dialog closes
            setDate(undefined)
            setTime("")
            setDuration(60)
            setMeetingLink("")
            setNotes("")
            setErrors({})
        }
    }, [open, existingInterview])

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!date) {
            newErrors.date = "Interview date is required"
        }
        if (!time) {
            newErrors.time = "Interview time is required"
        }
        if (!meetingLink || meetingLink.trim().length === 0) {
            newErrors.meetingLink = "Meeting link is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fill in all required fields correctly")
            return
        }

        setSubmitting(true)
        try {
            const isEditing = !!existingInterview?.id
            const url = isEditing
                ? `/api/interviews/update/${existingInterview.id}`
                : "/api/interviews/create"

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(isEditing ? {} : { applicantId, jobId }), // Only needed for create
                    scheduledDate: date!.toISOString(),
                    scheduledTime: time,
                    duration,
                    meetingLink,
                    notes,
                    ...(!isEditing && { sendEmail }), // Only for create
                }),
            })

            const data = await response.json()
            if (data.success) {
                toast.success(
                    isEditing
                        ? "Interview updated successfully"
                        : data.emailSent
                            ? "Interview scheduled and email sent!"
                            : "Interview scheduled successfully"
                )
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(data.error || `Failed to ${isEditing ? 'update' : 'schedule'} interview`)
            }
        } catch (error) {
            toast.error("An error occurred while scheduling the interview")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDialogClose = (isOpen: boolean) => {
        if (!isOpen) {
            // Reset errors when closing
            setErrors({})
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[500px]" dir={dir}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {existingInterview?.id
                            ? (t("applicants.interview.edit") || "Edit Interview")
                            : (t("applicants.interview.schedule") || "Schedule Interview")
                        }
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        {existingInterview?.id
                            ? `${t("applicants.interview.editFor") || "Update interview details for"} `
                            : `${t("applicants.interview.scheduleWith") || "Schedule an interview with"} `
                        }
                        <span className="font-medium">{applicantName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date Picker */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.date") || "Interview Date"} *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-start font-normal",
                                        !date && "text-muted-foreground",
                                        errors.date && "border-red-500"
                                    )}
                                >
                                    <CalendarIcon className="h-4 w-4 me-2" />
                                    {date ? format(date, "PPP") : (t("applicants.interview.selectDate") || "Select a date")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                        setDate(newDate)
                                        setErrors({ ...errors, date: undefined })
                                    }}
                                    initialFocus
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date && (
                            <p className="text-sm text-red-500 text-start">{errors.date}</p>
                        )}
                    </div>

                    {/* Time Select */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.time") || "Interview Time"} *</Label>
                        <Select
                            value={time}
                            onValueChange={(newTime) => {
                                setTime(newTime)
                                setErrors({ ...errors, time: undefined })
                            }}
                        >
                            <SelectTrigger className={cn(errors.time && "border-red-500")}>
                                <SelectValue placeholder={t("applicants.interview.selectTime") || "Select time"}>
                                    {time && (
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {time}
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                        {slot}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.time && (
                            <p className="text-sm text-red-500 text-start">{errors.time}</p>
                        )}
                    </div>

                    {/* Duration Select */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.duration") || "Duration"}</Label>
                        <Select
                            value={duration.toString()}
                            onValueChange={(v) => setDuration(parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {durationOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Meeting Link */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.meetingLink") || "Meeting Link"} *</Label>
                        <div className="relative">
                            <Video className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
                            <Input
                                placeholder="https://meet.google.com/... or meeting room name"
                                value={meetingLink}
                                onChange={(e) => {
                                    setMeetingLink(e.target.value)
                                    setErrors({ ...errors, meetingLink: undefined })
                                }}
                                className={cn("ps-10", errors.meetingLink && "border-red-500")}
                                dir="ltr"
                            />
                        </div>
                        {errors.meetingLink ? (
                            <p className="text-sm text-red-500 text-start">{errors.meetingLink}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground text-start">
                                {t("applicants.interview.meetingLinkHelp") || "Google Meet, Zoom, meeting room, or any location"}
                            </p>
                        )}
                    </div>

                    {/* Notes for Candidate */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.notes") || "Notes for Candidate"} ({t("common.optional") || "Optional"})</Label>
                        <Textarea
                            placeholder={t("applicants.interview.notesPlaceholder") || "Any preparation instructions or additional information..."}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="text-start"
                        />
                    </div>

                    {/* Send Email Toggle - Only show when creating new interview */}
                    {!existingInterview?.id && (
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary" />
                                <div className="text-start">
                                    <p className="text-sm font-medium">{t("applicants.interview.sendEmailInvite") || "Send Email Invitation"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t("applicants.interview.to") || "to"} {applicantEmail}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant={sendEmail ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSendEmail(!sendEmail)}
                            >
                                {sendEmail ? (t("common.yes") || "Yes") : (t("common.no") || "No")}
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>
                        {t("common.cancel") || "Cancel"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                        {submitting
                            ? (existingInterview?.id
                                ? (t("applicants.interview.updating") || "Updating...")
                                : (t("applicants.interview.scheduling") || "Scheduling...")
                            )
                            : (existingInterview?.id
                                ? (t("applicants.interview.update") || "Update Interview")
                                : (t("applicants.interview.schedule") || "Schedule Interview")
                            )
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
