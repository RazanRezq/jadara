"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/auth"
import {
    MoreHorizontal,
    Eye,
    FileText,
    Star,
    AlertTriangle,
    ChevronRight,
    Users,
} from "lucide-react"
import type { Applicant, EvaluationData, shouldHideSensitiveData } from "./types"

interface ApplicantListProps {
    applicants: Applicant[]
    evaluations: Map<string, EvaluationData>
    onApplicantClick: (applicant: Applicant) => void
    userRole: UserRole
}

export function ApplicantList({
    applicants,
    evaluations,
    onApplicantClick,
    userRole,
}: ApplicantListProps) {
    const { t, isRTL, locale } = useTranslate()

    // Check if we should hide sensitive data (for reviewers)
    const hideSensitiveData = userRole === 'reviewer'

    // Format date based on locale
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        const date = new Date(dateString)
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    // Get status badge variant and color
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
            new: { variant: "secondary", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
            screening: { variant: "secondary", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
            interviewing: { variant: "secondary", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
            evaluated: { variant: "secondary", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
            shortlisted: { variant: "secondary", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300" },
            hired: { variant: "secondary", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
            rejected: { variant: "destructive", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
            withdrawn: { variant: "secondary", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300" },
        }
        return statusConfig[status] || { variant: "outline" as const, className: "" }
    }

    // Get score color
    const getScoreColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400"
        if (score >= 50) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    // Avatar gradient
    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-400 to-rose-500",
            "from-indigo-400 to-blue-500",
        ]
        const index = (name?.charCodeAt(0) || 0) % gradients.length
        return gradients[index]
    }

    if (applicants.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                    <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px]">
                                {t("applicants.candidate")}
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                                {t("applicants.appliedDate")}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                                {t("applicants.role")}
                            </TableHead>
                            <TableHead className="text-center">
                                {t("applicants.aiScore")}
                            </TableHead>
                            <TableHead>{t("applicants.status.title")}</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applicants.map((applicant) => {
                            const evaluation = evaluations.get(applicant.id)
                            const score = evaluation?.overallScore ?? applicant.aiScore
                            const statusBadge = getStatusBadge(applicant.status)

                            return (
                                <TableRow
                                    key={applicant.id}
                                    className="cursor-pointer group"
                                    onClick={() => onApplicantClick(applicant)}
                                >
                                    {/* Candidate Info */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm shrink-0",
                                                    getAvatarGradient(applicant.displayName || applicant.personalData?.name || "A")
                                                )}
                                            >
                                                {(applicant.displayName || applicant.personalData?.name)?.charAt(0)?.toUpperCase() || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">
                                                        {applicant.displayName || applicant.personalData?.name || "Unnamed"}
                                                    </span>
                                                    {applicant.isSuspicious && (
                                                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground truncate block">
                                                    {applicant.personalData?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Applied Date - Hidden on mobile */}
                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                        {formatDate(applicant.submittedAt || applicant.createdAt)}
                                    </TableCell>

                                    {/* Role - Hidden on tablet and below */}
                                    <TableCell className="hidden lg:table-cell">
                                        <span className="truncate block max-w-[200px]">
                                            {applicant.jobId?.title || "-"}
                                        </span>
                                    </TableCell>

                                    {/* AI Score */}
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className={cn("font-bold", getScoreColor(score))}>
                                                {score ? `${score}%` : "-"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        <Badge
                                            variant={statusBadge.variant}
                                            className={cn("text-xs", statusBadge.className)}
                                        >
                                            {t(`applicants.status.${applicant.status}`)}
                                        </Badge>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onApplicantClick(applicant)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 me-2" />
                                                    {t("common.viewDetails")}
                                                </DropdownMenuItem>
                                                {applicant.cvUrl && (
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(applicant.cvUrl, "_blank")
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 me-2" />
                                                        {t("applicants.downloadCV")}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

// Mobile-friendly card list for small screens
export function ApplicantListMobile({
    applicants,
    evaluations,
    onApplicantClick,
    userRole,
}: ApplicantListProps) {
    const { t, locale } = useTranslate()

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        const date = new Date(dateString)
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, string> = {
            new: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
            screening: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
            interviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            evaluated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
            shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
            hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
            rejected: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
            withdrawn: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300",
        }
        return statusConfig[status] || ""
    }

    const getScoreColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 75) return "text-emerald-600"
        if (score >= 50) return "text-amber-600"
        return "text-red-600"
    }

    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-400 to-rose-500",
            "from-indigo-400 to-blue-500",
        ]
        const index = (name?.charCodeAt(0) || 0) % gradients.length
        return gradients[index]
    }

    if (applicants.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                    <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {applicants.map((applicant) => {
                const evaluation = evaluations.get(applicant.id)
                const score = evaluation?.overallScore ?? applicant.aiScore

                return (
                    <Card
                        key={applicant.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                        onClick={() => onApplicantClick(applicant)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shrink-0",
                                        getAvatarGradient(applicant.displayName || applicant.personalData?.name || "A")
                                    )}
                                >
                                    {(applicant.displayName || applicant.personalData?.name)?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h4 className="font-semibold truncate">
                                                {applicant.displayName || applicant.personalData?.name || "Unnamed"}
                                            </h4>
                                            {applicant.isSuspicious && (
                                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                            )}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-xs shrink-0", getStatusBadge(applicant.status))}
                                        >
                                            {t(`applicants.status.${applicant.status}`)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate mb-2">
                                        {applicant.jobId?.title || "-"}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className={cn("font-bold", getScoreColor(score))}>
                                                {score ? `${score}%` : "-"}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(applicant.submittedAt || applicant.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
