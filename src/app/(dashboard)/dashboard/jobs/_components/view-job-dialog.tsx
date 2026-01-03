"use client"

import ReactMarkdown from "react-markdown"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Briefcase,
    MapPin,
    Building2,
    DollarSign,
    Calendar,
    Clock,
    Link as LinkIcon,
    Copy,
} from "lucide-react"
import { toast } from "sonner"
import type { Job, JobStatus } from "./jobs-client"

interface ViewJobDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    job: Job
}

const statusColors: Record<JobStatus, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function ViewJobDialog({ open, onOpenChange, job }: ViewJobDialogProps) {
    const { t, isRTL } = useTranslate()

    const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/apply/${job.id}` : ''

    const handleCopyLink = () => {
        navigator.clipboard.writeText(jobUrl).then(() => {
            toast.success(t("jobs.linkCopied"))
        }).catch((error) => {
            console.error("Failed to copy link:", error)
            toast.error(t("common.error"))
        })
    }

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
        if (min && max) return `$${min.toLocaleString('en-US')} - $${max.toLocaleString('en-US')}`
        if (min) return `$${min.toLocaleString('en-US')}+`
        return `Up to $${max?.toLocaleString('en-US')}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
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
                    {/* Share Section */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <LinkIcon className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-lg">{t("jobs.shareSection")}</h4>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                            {t("jobs.jobUrl")}
                        </p>
                        
                        <div className="flex gap-2">
                            <Input
                                value={jobUrl}
                                readOnly
                                className="bg-white dark:bg-slate-900 font-mono text-sm"
                                dir="ltr"
                            />
                            <Button
                                onClick={handleCopyLink}
                                size="lg"
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all shrink-0"
                            >
                                <Copy className="h-4 w-4 me-2" />
                                {t("jobs.copyLink")}
                            </Button>
                        </div>
                    </div>

                    <Separator />
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
                        <article
                            className="prose prose-sm max-w-none text-start"
                            dir={isRTL ? "rtl" : "ltr"}
                        >
                            <ReactMarkdown>{job.description}</ReactMarkdown>
                        </article>
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

