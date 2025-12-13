"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Briefcase,
    MapPin,
    Building2,
    DollarSign,
    Calendar,
    Clock,
} from "lucide-react"
import type { Job, JobStatus } from "./jobs-client"

interface ViewJobDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    job: Job
}

const statusColors: Record<JobStatus, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    closed: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function ViewJobDialog({ open, onOpenChange, job }: ViewJobDialogProps) {
    const { t, isRTL } = useTranslate()

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return "-"
        if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
        if (min) return `$${min.toLocaleString()}+`
        return `Up to $${max?.toLocaleString()}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shrink-0">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl">{job.title}</DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge className={cn("border-0", statusColors[job.status])}>
                                    {t(`jobs.status.${job.status}`)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {job.employmentType.replace("-", " ")}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {job.department && (
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("jobs.department")}:</span>
                                <span className="font-medium">{job.department}</span>
                            </div>
                        )}
                        {job.location && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("jobs.location")}:</span>
                                <span className="font-medium">{job.location}</span>
                            </div>
                        )}
                        {(job.salaryMin || job.salaryMax) && (
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("jobs.salary")}:</span>
                                <span className="font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("jobs.created")}:</span>
                            <span className="font-medium">{formatDate(job.createdAt)}</span>
                        </div>
                        {job.expiresAt && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("jobs.expires")}:</span>
                                <span className="font-medium">{formatDate(job.expiresAt)}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                        <h4 className="font-semibold mb-2">{t("jobs.description")}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </div>

                    {/* Required Skills */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-3">{t("jobs.requiredSkills")}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills.map((skill, index) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Responsibilities */}
                    {job.responsibilities && job.responsibilities.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-3">{t("jobs.responsibilities")}</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {job.responsibilities.map((resp, index) => (
                                        <li key={index}>{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Evaluation Criteria */}
                    {job.criteria && job.criteria.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-3">{t("jobs.evaluationCriteria")}</h4>
                                <div className="space-y-3">
                                    {job.criteria.map((criterion, index) => (
                                        <div
                                            key={index}
                                            className="p-3 rounded-lg bg-muted/50 border"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{criterion.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t("jobs.weight")}: {criterion.weight}/10
                                                    </span>
                                                    {criterion.required && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            {t("jobs.required")}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {criterion.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {criterion.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Created By */}
                    {job.createdBy && (
                        <>
                            <Separator />
                            <div className="text-sm text-muted-foreground">
                                {t("jobs.createdBy")}: {job.createdBy.name} ({job.createdBy.email})
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

