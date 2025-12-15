"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { type UserRole } from "@/lib/auth"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Search,
    MoreHorizontal,
    Eye,
    RefreshCw,
    Users,
    Star,
    AlertTriangle,
    Mail,
    Phone,
    Download,
} from "lucide-react"
import { ViewApplicantDialog } from "./view-applicant-dialog"
import { toast } from "sonner"

export type ApplicantStatus =
    | 'new'
    | 'screening'
    | 'interviewing'
    | 'evaluated'
    | 'shortlisted'
    | 'hired'
    | 'rejected'
    | 'withdrawn'

export interface Applicant {
    id: string
    jobId: { _id: string; title: string }
    personalData: {
        name: string
        email: string
        phone: string
        age?: number
        major?: string
        yearsOfExperience?: number
        salaryExpectation?: number
        linkedinUrl?: string
        behanceUrl?: string
        portfolioUrl?: string
    }
    cvUrl?: string
    status: ApplicantStatus
    tags: string[]
    notes: string
    aiScore?: number
    aiSummary?: string
    aiRedFlags?: string[]
    isSuspicious: boolean
    isComplete: boolean
    submittedAt?: string
    createdAt: string
}

interface ApplicantsClientProps {
    currentUserRole: UserRole
    userId: string
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

export function ApplicantsClient({ currentUserRole, userId }: ApplicantsClientProps) {
    const { t, isRTL } = useTranslate()
    const searchParams = useSearchParams()
    const jobIdFromUrl = searchParams.get("jobId")

    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [jobFilter, setJobFilter] = useState<string>(jobIdFromUrl || "all")
    const [minScore, setMinScore] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)

    const fetchJobs = useCallback(async () => {
        try {
            const response = await fetch("/api/jobs/list?limit=100")
            const data = await response.json()
            if (data.success) {
                setJobs(data.jobs.map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })))
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        }
    }, [])

    const fetchApplicants = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                role: currentUserRole,
            })
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
            if (jobFilter && jobFilter !== "all") params.append("jobId", jobFilter)
            if (minScore) params.append("minScore", minScore)

            const response = await fetch(`/api/applicants/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setApplicants(data.applicants)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            }
        } catch (error) {
            console.error("Failed to fetch applicants:", error)
            toast.error(t("common.loading"))
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, statusFilter, jobFilter, minScore, currentUserRole, t])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    useEffect(() => {
        fetchApplicants()
    }, [fetchApplicants])

    useEffect(() => {
        if (jobIdFromUrl) {
            setJobFilter(jobIdFromUrl)
        }
    }, [jobIdFromUrl])

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        setPage(1)
    }

    const handleJobFilter = (value: string) => {
        setJobFilter(value)
        setPage(1)
    }

    const handleViewApplicant = (applicant: Applicant) => {
        setSelectedApplicant(applicant)
        setViewDialogOpen(true)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const getScoreColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
        if (score >= 60) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t("applicants.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("applicants.subtitle")}
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                        isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                        placeholder={t("applicants.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={cn(
                            isRTL ? "pr-10 text-right" : "pl-10"
                        )}
                    />
                </div>

                {/* Job Filter */}
                <Select value={jobFilter} onValueChange={handleJobFilter}>
                    <SelectTrigger className="w-full lg:w-[200px]">
                        <SelectValue placeholder={t("applicants.filterByJob")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("applicants.allJobs")}</SelectItem>
                        {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                                {job.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                        <SelectValue placeholder={t("applicants.filterByStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("applicants.allStatuses")}</SelectItem>
                        <SelectItem value="new">{t("applicants.status.new")}</SelectItem>
                        <SelectItem value="screening">{t("applicants.status.screening")}</SelectItem>
                        <SelectItem value="interviewing">{t("applicants.status.interviewing")}</SelectItem>
                        <SelectItem value="evaluated">{t("applicants.status.evaluated")}</SelectItem>
                        <SelectItem value="shortlisted">{t("applicants.status.shortlisted")}</SelectItem>
                        <SelectItem value="hired">{t("applicants.status.hired")}</SelectItem>
                        <SelectItem value="rejected">{t("applicants.status.rejected")}</SelectItem>
                    </SelectContent>
                </Select>

                {/* Min Score */}
                <Input
                    type="number"
                    placeholder={t("applicants.minScore")}
                    value={minScore}
                    onChange={(e) => {
                        setMinScore(e.target.value)
                        setPage(1)
                    }}
                    className="w-full lg:w-[120px]"
                    min="0"
                    max="100"
                />

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchApplicants}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Applicants Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner className="h-8 w-8 text-primary" />
                        </div>
                    ) : applicants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Users className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                            <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("applicants.candidate")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("applicants.job")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("applicants.score")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("common.status")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("applicants.experience")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("applicants.submitted")}</TableHead>
                                    <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applicants.map((applicant) => (
                                    <TableRow key={applicant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                                                    {applicant.personalData?.name?.charAt(0)?.toUpperCase() ||
                                                        applicant.personalData?.email?.charAt(0)?.toUpperCase() ||
                                                        'A'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">
                                                            {applicant.personalData?.name?.trim() ||
                                                                applicant.personalData?.email?.split('@')[0] ||
                                                                'Unknown'}
                                                        </p>
                                                        {applicant.isSuspicious && (
                                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate max-w-[150px]">{applicant.personalData?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {applicant.jobId?.title || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {applicant.aiScore !== undefined ? (
                                                <div className="flex items-center gap-1">
                                                    <Star className={cn("h-4 w-4", getScoreColor(applicant.aiScore))} />
                                                    <span className={cn("font-medium", getScoreColor(applicant.aiScore))}>
                                                        {applicant.aiScore}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("border-0", statusColors[applicant.status])}>
                                                {t(`applicants.status.${applicant.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {applicant.personalData?.yearsOfExperience !== undefined
                                                ? `${applicant.personalData.yearsOfExperience} ${t("applicants.years")}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(applicant.submittedAt)}
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-left" : "text-right"}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleViewApplicant(applicant)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("common.view")}
                                                    </DropdownMenuItem>
                                                    {applicant.cvUrl && (
                                                        <DropdownMenuItem
                                                            onClick={() => window.open(applicant.cvUrl, "_blank")}
                                                            className="cursor-pointer"
                                                        >
                                                            <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                            {t("applicants.downloadCV")}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => applicant.personalData?.email && (window.location.href = `mailto:${applicant.personalData.email}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Mail className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("applicants.sendEmail")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => applicant.personalData?.phone && (window.location.href = `tel:${applicant.personalData.phone}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Phone className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("applicants.call")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                {t("common.showing")} {applicants.length} {t("common.of")} {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    {t("common.previous")}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {t("common.page")} {page} {t("common.of")} {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    {t("common.next")}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Dialog */}
            {selectedApplicant && (
                <ViewApplicantDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    applicant={selectedApplicant}
                    userRole={currentUserRole}
                    userId={userId}
                    onStatusChange={fetchApplicants}
                />
            )}
        </div>
    )
}
