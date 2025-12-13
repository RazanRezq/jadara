"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { type UserRole } from "@/lib/auth"
import { toast } from "sonner"
import {
    User,
    Mail,
    Phone,
    GraduationCap,
    Briefcase,
    DollarSign,
    Linkedin,
    Globe,
    AlertTriangle,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    MessageSquare,
} from "lucide-react"
import type { Applicant, ApplicantStatus } from "./applicants-client"

interface ViewApplicantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicant: Applicant
    userRole: UserRole
    userId: string
    onStatusChange: () => void
}

const statusColors: Record<ApplicantStatus, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    screening: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    interviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    evaluated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export function ViewApplicantDialog({
    open,
    onOpenChange,
    applicant,
    userRole,
    userId,
    onStatusChange,
}: ViewApplicantDialogProps) {
    const { t, isRTL } = useTranslate()
    const [updating, setUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<ApplicantStatus>(applicant.status)

    const isReviewer = userRole === "reviewer"

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true)
        try {
            const response = await fetch(
                `/api/applicants/update/${applicant.id}?userId=${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            )

            const data = await response.json()

            if (data.success) {
                setCurrentStatus(newStatus as ApplicantStatus)
                toast.success(t("applicants.statusUpdated"))
                onStatusChange()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Update status error:", error)
            toast.error(t("common.error"))
        } finally {
            setUpdating(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getScoreColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
        if (score >= 60) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                                {applicant.personalData.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    {applicant.personalData.name}
                                    {applicant.isSuspicious && (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    )}
                                </DialogTitle>
                                <p className="text-muted-foreground">
                                    {applicant.jobId?.title || t("applicants.noJob")}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={cn("border-0", statusColors[currentStatus])}>
                                {t(`applicants.status.${currentStatus}`)}
                            </Badge>
                            {applicant.aiScore !== undefined && (
                                <div className={cn("flex items-center gap-1 text-lg font-semibold", getScoreColor(applicant.aiScore))}>
                                    <Star className="h-5 w-5" />
                                    {applicant.aiScore}%
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="profile" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">{t("applicants.profile")}</TabsTrigger>
                        <TabsTrigger value="evaluation">{t("applicants.evaluation")}</TabsTrigger>
                        <TabsTrigger value="actions">{t("applicants.actions")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6 mt-4">
                        {/* Contact Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                                    <p className="font-medium">{applicant.personalData.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t("applicants.phone")}</p>
                                    <p className="font-medium">{applicant.personalData.phone}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Professional Info */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {applicant.personalData.age && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("applicants.age")}</p>
                                        <p className="font-medium">{applicant.personalData.age}</p>
                                    </div>
                                </div>
                            )}
                            {applicant.personalData.major && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("applicants.major")}</p>
                                        <p className="font-medium">{applicant.personalData.major}</p>
                                    </div>
                                </div>
                            )}
                            {applicant.personalData.yearsOfExperience !== undefined && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("applicants.experience")}</p>
                                        <p className="font-medium">{applicant.personalData.yearsOfExperience} {t("applicants.years")}</p>
                                    </div>
                                </div>
                            )}
                            {/* Only show salary to non-reviewers */}
                            {!isReviewer && applicant.personalData.salaryExpectation && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("applicants.salaryExpectation")}</p>
                                        <p className="font-medium">${applicant.personalData.salaryExpectation.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Links */}
                        {(applicant.personalData.linkedinUrl || applicant.personalData.behanceUrl || applicant.personalData.portfolioUrl || applicant.cvUrl) && (
                            <>
                                <Separator />
                                <div className="flex flex-wrap gap-3">
                                    {applicant.personalData.linkedinUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(applicant.personalData.linkedinUrl, "_blank")}
                                        >
                                            <Linkedin className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                            LinkedIn
                                        </Button>
                                    )}
                                    {applicant.personalData.behanceUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(applicant.personalData.behanceUrl, "_blank")}
                                        >
                                            <Globe className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                            Behance
                                        </Button>
                                    )}
                                    {applicant.personalData.portfolioUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(applicant.personalData.portfolioUrl, "_blank")}
                                        >
                                            <Globe className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                            {t("applicants.portfolio")}
                                        </Button>
                                    )}
                                    {applicant.cvUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(applicant.cvUrl, "_blank")}
                                        >
                                            <FileText className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                            {t("applicants.viewCV")}
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Submission Info */}
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {t("applicants.submitted")}: {formatDate(applicant.submittedAt || applicant.createdAt)}
                        </div>
                    </TabsContent>

                    <TabsContent value="evaluation" className="space-y-6 mt-4">
                        {/* AI Score */}
                        {applicant.aiScore !== undefined && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">{t("applicants.aiScore")}</h4>
                                    <span className={cn("text-2xl font-bold", getScoreColor(applicant.aiScore))}>
                                        {applicant.aiScore}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={cn(
                                            "h-2 rounded-full",
                                            applicant.aiScore >= 80 ? "bg-emerald-500" :
                                            applicant.aiScore >= 60 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${applicant.aiScore}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* AI Summary */}
                        {applicant.aiSummary && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    {t("applicants.aiSummary")}
                                </h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/50">
                                    {applicant.aiSummary}
                                </p>
                            </div>
                        )}

                        {/* Red Flags - Hidden from reviewers */}
                        {!isReviewer && applicant.aiRedFlags && applicant.aiRedFlags.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    {t("applicants.redFlags")}
                                </h4>
                                <ul className="space-y-2">
                                    {applicant.aiRedFlags.map((flag, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tags */}
                        {applicant.tags && applicant.tags.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">{t("applicants.tags")}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {applicant.tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {applicant.notes && (
                            <div>
                                <h4 className="font-semibold mb-2">{t("applicants.notes")}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/50">
                                    {applicant.notes}
                                </p>
                            </div>
                        )}

                        {/* Suspicious Flag */}
                        {applicant.isSuspicious && (
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-semibold">{t("applicants.suspiciousActivity")}</span>
                                </div>
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                    {t("applicants.suspiciousDescription")}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-6 mt-4">
                        {/* Update Status */}
                        <div>
                            <h4 className="font-semibold mb-3">{t("applicants.updateStatus")}</h4>
                            <Select
                                value={currentStatus}
                                onValueChange={handleStatusChange}
                                disabled={updating}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            {t("applicants.status.new")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="screening">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                            {t("applicants.status.screening")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="interviewing">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            {t("applicants.status.interviewing")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="evaluated">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                            {t("applicants.status.evaluated")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="shortlisted">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                            {t("applicants.status.shortlisted")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="hired">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                                            {t("applicants.status.hired")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        <span className="flex items-center gap-2">
                                            <XCircle className="h-3 w-3 text-red-500" />
                                            {t("applicants.status.rejected")}
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Quick Actions */}
                        <div>
                            <h4 className="font-semibold mb-3">{t("applicants.quickActions")}</h4>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = `mailto:${applicant.personalData.email}`}
                                >
                                    <Mail className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("applicants.sendEmail")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = `tel:${applicant.personalData.phone}`}
                                >
                                    <Phone className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("applicants.call")}
                                </Button>
                                {applicant.cvUrl && (
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(applicant.cvUrl, "_blank")}
                                    >
                                        <FileText className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                        {t("applicants.downloadCV")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
