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
}: ScheduleInterviewDialogProps) {
    const { t, dir } = useTranslate()
    const [submitting, setSubmitting] = useState(false)
    const [date, setDate] = useState<Date>()
    const [time, setTime] = useState<string>("")
    const [duration, setDuration] = useState<number>(60)
    const [meetingLink, setMeetingLink] = useState("")
    const [notes, setNotes] = useState("")
    const [sendEmail, setSendEmail] = useState(true)

    const handleSubmit = async () => {
        if (!date || !time || !meetingLink) {
            toast.error("Please fill in all required fields")
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch("/api/interviews/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId,
                    jobId,
                    scheduledDate: date.toISOString(),
                    scheduledTime: time,
                    duration,
                    meetingLink,
                    notes,
                    sendEmail,
                }),
            })

            const data = await response.json()
            if (data.success) {
                toast.success(
                    data.emailSent
                        ? "Interview scheduled and email sent!"
                        : "Interview scheduled successfully"
                )
                onSuccess()
                onOpenChange(false)
                // Reset form
                setDate(undefined)
                setTime("")
                setMeetingLink("")
                setNotes("")
            } else {
                toast.error(data.error || "Failed to schedule interview")
            }
        } catch (error) {
            toast.error("An error occurred while scheduling the interview")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" dir={dir}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {t("applicants.interview.schedule") || "Schedule Interview"}
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        {t("applicants.interview.scheduleWith") || "Schedule an interview with"}{" "}
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
                                        !date && "text-muted-foreground"
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
                                    onSelect={setDate}
                                    initialFocus
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Time Select */}
                    <div className="grid gap-2">
                        <Label>{t("applicants.interview.time") || "Interview Time"} *</Label>
                        <Select value={time} onValueChange={setTime}>
                            <SelectTrigger>
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
                                placeholder="https://meet.google.com/..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                className="ps-10"
                                dir="ltr"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-start">
                            {t("applicants.interview.meetingLinkHelp") || "Google Meet, Zoom, or any video conferencing link"}
                        </p>
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

                    {/* Send Email Toggle */}
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("common.cancel") || "Cancel"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                        {submitting ? (t("applicants.interview.scheduling") || "Scheduling...") : (t("applicants.interview.schedule") || "Schedule Interview")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
