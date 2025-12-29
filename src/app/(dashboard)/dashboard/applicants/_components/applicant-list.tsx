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
    Star,
    AlertTriangle,
    ChevronRight,
    Users,
    Banknote,
} from "lucide-react"
import type { Applicant, EvaluationData } from "./types"

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY: IBM Plex Sans Arabic
// ═══════════════════════════════════════════════════════════════════════════════
import { IBM_Plex_Sans_Arabic } from "next/font/google"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
})

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENCY FORMATTING HELPER
// ═══════════════════════════════════════════════════════════════════════════════
const CURRENCY_MAP: Record<string, { code: string; symbol: string; locale: string }> = {
    SAR: { code: 'SAR', symbol: 'ر.س', locale: 'ar-SA' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US' },
    AED: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
    EGP: { code: 'EGP', symbol: 'ج.م', locale: 'ar-EG' },
}

function formatCurrency(amount: number | undefined, currencyCode: string = 'SAR', uiLocale: string = 'ar'): string {
    if (!amount) return "-"
    const currency = CURRENCY_MAP[currencyCode] || CURRENCY_MAP.SAR
    const locale = uiLocale === 'ar' ? currency.locale : 'en-US'
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    } catch {
        return `${amount.toLocaleString()} ${currencyCode}`
    }
}

interface ApplicantListProps {
    applicants: Applicant[]
    evaluations: Map<string, EvaluationData>
    onApplicantClick: (applicant: Applicant) => void
    userRole: UserRole
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DESKTOP VIEW: FIXED RTL ALIGNMENT & SPACING
// ═══════════════════════════════════════════════════════════════════════════════
export function ApplicantList({
    applicants,
    evaluations,
    onApplicantClick,
    userRole,
}: ApplicantListProps) {
    const { t, isRTL, locale } = useTranslate()
    const hideSensitiveData = userRole === 'reviewer'

    // Check if any applicant has interview data to conditionally show the Interview column
    const hasInterviews = applicants.some(a => a.interview)

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        const date = new Date(dateString)
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        })
    }

    const formatInterviewDateTime = (interview?: { scheduledDate: string; scheduledTime: string }) => {
        if (!interview) return "-"
        const date = new Date(interview.scheduledDate)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()

        // Convert 24-hour time to 12-hour format with AM/PM
        const [hours24, minutes] = interview.scheduledTime.split(':')
        const hours = parseInt(hours24)
        const period = hours >= 12 ? 'PM' : 'AM'
        const hours12 = hours % 12 || 12
        const time12 = `${String(hours12).padStart(2, '0')}:${minutes} ${period}`

        return `${day}/${month}/${year} ${time12}`
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
            new: { variant: "secondary", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
            evaluated: { variant: "secondary", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
            interview: { variant: "secondary", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
            hired: { variant: "secondary", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
            rejected: { variant: "destructive", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
        }
        return statusConfig[status] || { variant: "outline" as const, className: "" }
    }

    return (
        <Card dir={isRTL ? "rtl" : "ltr"} className={cn("overflow-hidden border bg-card", ibmPlexArabic.className)}>
            <CardContent className="p-0">
                {/* Desktop table view - hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                <Table className="w-full table-auto font-ibm-plex">
                    <TableHeader>
                        <TableRow className="border-b">
                            {/* Column 1: Candidate (primary column, grows with content) */}
                            <TableHead
                                className={cn(
                                    "px-6 h-12 min-w-[250px] w-auto",
                                    isRTL ? "text-right" : "text-left"
                                )}
                            >
                                {t("applicants.candidate")}
                            </TableHead>

                            <TableHead className="hidden md:table-cell px-6 text-start">
                                {t("applicants.appliedDate")}
                            </TableHead>

                            <TableHead className="hidden lg:table-cell px-6 text-start">
                                {t("applicants.role")}
                            </TableHead>

                            <TableHead className="px-6 text-start">
                                {t("applicants.aiScore")}
                            </TableHead>

                            {!hideSensitiveData && (
                                <TableHead className="hidden xl:table-cell px-6 text-start">
                                    {t("applicants.expectedSalary")}
                                </TableHead>
                            )}

                            <TableHead className="px-6 text-start">
                                {t("applicants.status.title")}
                            </TableHead>

                            {hasInterviews && (
                                <TableHead className="hidden lg:table-cell px-6 text-start">
                                    {t("applicants.interviewDate")}
                                </TableHead>
                            )}

                            <TableHead className="px-6 text-end">{t("common.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applicants.map((applicant) => {
                            const evaluation = evaluations.get(applicant.id)
                            const score = evaluation?.overallScore ?? applicant.aiScore
                            const jobCurrency = applicant.jobId?.currency || 'SAR'
                            const statusBadge = getStatusBadge(applicant.status)

                            return (
                                <TableRow key={applicant.id} className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150" onClick={() => onApplicantClick(applicant)}>

                                    {/* Candidate column: flex-start with RTL-aware direction */}
                                    <TableCell
                                        className={cn("px-6 py-4", isRTL ? "text-right" : "text-left")}
                                        dir={isRTL ? "rtl" : "ltr"}
                                    >
                                        <div className="flex items-center gap-3 justify-start w-full">
                                            {/* Avatar with gradient background like jobs page */}
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                                <Users className="h-5 w-5" />
                                            </div>

                                            {/* Text following the avatar naturally */}
                                            <div className="min-w-0 flex-1 leading-tight">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="font-semibold truncate">
                                                        {applicant.displayName || applicant.personalData?.name}
                                                    </span>
                                                    {applicant.isSuspicious && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                                                </div>
                                                <span className="text-sm text-muted-foreground truncate block">
                                                    {applicant.personalData?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="hidden md:table-cell px-6 py-4 text-start text-muted-foreground">
                                        {formatDate(applicant.submittedAt || applicant.createdAt)}
                                    </TableCell>

                                    <TableCell className="hidden lg:table-cell px-6 py-4 text-start truncate">
                                        {applicant.jobId?.title || "-"}
                                    </TableCell>

                                    <TableCell className="px-6 py-4 text-start">
                                        <div className="flex items-center gap-1 font-semibold">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span>{score ? `${score}%` : "-"}</span>
                                        </div>
                                    </TableCell>

                                    {!hideSensitiveData && (
                                        <TableCell className="hidden xl:table-cell px-6 py-4 text-start font-semibold">
                                            {formatCurrency(applicant.personalData?.salaryExpectation, jobCurrency, locale)}
                                        </TableCell>
                                    )}

                                    <TableCell className="px-6 py-4 text-start">
                                        <Badge
                                            variant={statusBadge.variant}
                                            className={cn("inline-flex border-0 gap-1.5", statusBadge.className)}
                                        >
                                            {t(`applicants.status.${applicant.status}`)}
                                        </Badge>
                                    </TableCell>

                                    {hasInterviews && (
                                        <TableCell className="hidden lg:table-cell px-6 py-4 text-start text-muted-foreground">
                                            {applicant.interview ? formatInterviewDateTime(applicant.interview) : "-"}
                                        </TableCell>
                                    )}

                                    <TableCell className="px-6 py-4 text-end">
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                </div>

                {/* Mobile card view - shown on mobile only */}
                <div className="md:hidden p-4 space-y-3">
                    {applicants.map((applicant) => {
                        const evaluation = evaluations.get(applicant.id)
                        const score = evaluation?.overallScore ?? applicant.aiScore
                        const jobCurrency = applicant.jobId?.currency || 'SAR'
                        const statusBadge = getStatusBadge(applicant.status)

                        return (
                            <Card
                                key={applicant.id}
                                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/30"
                                onClick={() => onApplicantClick(applicant)}
                            >
                                <CardContent className="p-4 space-y-3">
                                    {/* Header with name and avatar */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4 className="font-semibold text-base truncate">
                                                        {applicant.displayName || applicant.personalData?.name}
                                                    </h4>
                                                    {applicant.isSuspicious && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {applicant.personalData?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={statusBadge.variant}
                                            className={cn("inline-flex border-0 gap-1.5 shrink-0", statusBadge.className)}
                                        >
                                            {t(`applicants.status.${applicant.status}`)}
                                        </Badge>
                                    </div>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                        {/* Job role */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">{t("applicants.role")}</p>
                                            <p className="text-sm font-medium truncate">{applicant.jobId?.title || "-"}</p>
                                        </div>

                                        {/* AI Score */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">{t("applicants.aiScore")}</p>
                                            <div className="flex items-center gap-1 font-semibold text-sm">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span>{score ? `${score}%` : "-"}</span>
                                            </div>
                                        </div>

                                        {/* Applied date */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">{t("applicants.appliedDate")}</p>
                                            <p className="text-sm">{formatDate(applicant.submittedAt || applicant.createdAt)}</p>
                                        </div>

                                        {/* Expected salary (only for non-reviewers) */}
                                        {!hideSensitiveData && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">{t("applicants.expectedSalary")}</p>
                                                <p className="text-sm font-semibold flex items-center gap-1">
                                                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {formatCurrency(applicant.personalData?.salaryExpectation, jobCurrency, locale)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Interview date/time (if exists) */}
                                        {applicant.interview && (
                                            <div className={!hideSensitiveData ? "col-span-2" : "col-span-1"}>
                                                <p className="text-xs text-muted-foreground mb-1">{t("applicants.interviewDate")}</p>
                                                <p className="text-sm">{formatInterviewDateTime(applicant.interview)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action button */}
                                    <div className="flex justify-end pt-2">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Eye className="h-4 w-4" />
                                            {t("common.view")}
                                            <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MOBILE VIEW: FIXES THE BUILD ERROR
// ═══════════════════════════════════════════════════════════════════════════════
export function ApplicantListMobile({
    applicants,
    evaluations,
    onApplicantClick,
    userRole,
}: ApplicantListProps) {
    const { t, isRTL } = useTranslate()
    const hideSensitiveData = userRole === 'reviewer'

    return (
        <div className={cn("space-y-3", ibmPlexArabic.className)} dir={isRTL ? "rtl" : "ltr"}>
            {applicants.map((applicant) => (
                <Card key={applicant.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onApplicantClick(applicant)}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Gradient avatar like jobs page */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <h4 className="font-semibold text-base truncate">{applicant.displayName || applicant.personalData?.name}</h4>
                                <p className="text-sm text-muted-foreground">{applicant.jobId?.title}</p>
                            </div>
                        </div>
                        <ChevronRight className={cn("h-5 w-5 text-slate-300", isRTL && "rotate-180")} />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}