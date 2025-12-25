"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { hasPermission, type UserRole } from "@/lib/auth"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Briefcase,
    Eye,
    RefreshCw,
    Users,
    FileQuestion,
    AlertCircle,
    CheckCircle2,
    Clock,
    Activity,
    Link as LinkIcon,
    Ban,
    ExternalLink,
    Inbox,
    Star,
    Trophy,
} from "lucide-react"
import { JobWizardDialog } from "./wizard"
import { DeleteJobDialog } from "./delete-job-dialog"
import { ViewJobDialog } from "./view-job-dialog"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type JobStatus = 'draft' | 'active' | 'closed' | 'archived'

export interface Job {
    id: string
    title: string
    description: string
    department: string
    location: string
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
    salaryMin?: number
    salaryMax?: number
    requiredSkills: string[]
    responsibilities: string[]
    criteria: { name: string; description: string; weight: number; required: boolean }[]
    status: JobStatus
    expiresAt?: string
    createdBy: { name: string; email: string }
    createdAt: string
    updatedAt: string
    applicantsCount?: number
}

interface JobsClientProps {
    currentUserRole: UserRole
    userId: string
}

const statusColors: Record<JobStatus, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    closed: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    archived: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export function JobsClient({ currentUserRole, userId }: JobsClientProps) {
    const { t, isRTL } = useTranslate()
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Actionable stats
    const [actionableStats, setActionableStats] = useState({
        needsReview: 0,
        topTalent: 0,
        activeJobs: 0,
    })
    const [statsLoading, setStatsLoading] = useState(true)

    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)

    const fetchJobs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            })
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)

            const response = await fetch(`/api/jobs/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setJobs(data.jobs)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
            toast.error(t("common.loading"))
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, statusFilter, t])

    // Fetch actionable stats
    const fetchActionableStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const response = await fetch('/api/jobs/stats/actionable')
            const data = await response.json()
            if (data.success) {
                setActionableStats(data.stats)
            }
        } catch (error) {
            console.error("Failed to fetch actionable stats:", error)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchJobs()
        fetchActionableStats()
    }, [fetchJobs, fetchActionableStats])

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        setPage(1)
    }

    const handleViewJob = (job: Job) => {
        setSelectedJob(job)
        setViewDialogOpen(true)
    }

    const handleEditJob = (job: Job) => {
        router.push(`/dashboard/jobs/${job.id}/edit`)
    }

    const handleDeleteJob = (job: Job) => {
        setSelectedJob(job)
        setDeleteDialogOpen(true)
    }

    const handleCopyApplicationLink = (jobId: string) => {
        const jobUrl = `${window.location.origin}/apply/${jobId}`
        navigator.clipboard.writeText(jobUrl).then(() => {
            toast.success(t("jobs.linkCopied"))
        }).catch((error) => {
            console.error("Failed to copy link:", error)
            toast.error(t("common.error"))
        })
    }

    const handleToggleStatus = async (job: Job, checked: boolean) => {
        const newStatus = checked ? 'active' : 'closed'
        const previousStatus = job.status

        // Optimistic update
        setJobs(prevJobs =>
            prevJobs.map(j =>
                j.id === job.id ? { ...j, status: newStatus as JobStatus } : j
            )
        )

        try {
            const response = await fetch(`/api/jobs/toggle-status/${job.id}?userId=${userId}`, {
                method: "POST",
            })
            const data = await response.json()

            if (data.success) {
                toast.success(
                    newStatus === 'active'
                        ? t("jobs.hiringActivated")
                        : t("jobs.hiringClosed")
                )
                // Refresh to get latest data
                fetchJobs()
                fetchActionableStats()
            } else {
                // Revert on error
                setJobs(prevJobs =>
                    prevJobs.map(j =>
                        j.id === job.id ? { ...j, status: previousStatus } : j
                    )
                )
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to toggle status:", error)
            // Revert on error
            setJobs(prevJobs =>
                prevJobs.map(j =>
                    j.id === job.id ? { ...j, status: previousStatus } : j
                )
            )
            toast.error(t("common.error"))
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    // Actionable stats cards
    const actionableCards = [
        {
            labelKey: "jobs.stats.needsReview",
            value: actionableStats.needsReview,
            icon: Inbox,
            color: "from-orange-500 to-amber-500",
            shadowColor: "shadow-orange-500/20",
            href: "/dashboard/applicants?status=new",
        },
        {
            labelKey: "jobs.stats.topTalent",
            value: actionableStats.topTalent,
            icon: Trophy,
            color: "from-emerald-500 to-green-500",
            shadowColor: "shadow-emerald-500/20",
            href: "/dashboard/applicants?minScore=80",
        },
        {
            labelKey: "jobs.stats.activeJobs",
            value: actionableStats.activeJobs,
            icon: Briefcase,
            color: "from-blue-500 to-indigo-500",
            shadowColor: "shadow-blue-500/20",
            onClick: () => {
                setStatusFilter("active")
                setPage(1)
            },
        },
    ]

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t("jobs.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("jobs.subtitle")}
                    </p>
                </div>
            </div>

            {/* Actionable Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {actionableCards.map((card, index) => {
                    if (card.href) {
                        return (
                            <Link key={index} href={card.href}>
                                <Card className="relative overflow-hidden transition-all hover:shadow-lg cursor-pointer">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className={cn(
                                            "text-sm font-medium text-muted-foreground",
                                            isRTL && "text-right"
                                        )}>
                                            {t(card.labelKey)}
                                        </CardTitle>
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-lg bg-gradient-to-br",
                                                card.color,
                                                "flex items-center justify-center shadow-lg",
                                                card.shadowColor
                                            )}
                                        >
                                            <card.icon className="w-5 h-5 text-white" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn(
                                            "text-2xl font-bold",
                                            isRTL && "text-right"
                                        )}>
                                            {statsLoading ? (
                                                <Spinner className="h-6 w-6 text-muted-foreground" />
                                            ) : (
                                                card.value
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    }

                    return (
                        <Card
                            key={index}
                            onClick={card.onClick}
                            className="relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className={cn(
                                    "text-sm font-medium text-muted-foreground",
                                    isRTL && "text-right"
                                )}>
                                    {t(card.labelKey)}
                                </CardTitle>
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-lg bg-gradient-to-br",
                                        card.color,
                                        "flex items-center justify-center shadow-lg",
                                        card.shadowColor
                                    )}
                                >
                                    <card.icon className="w-5 h-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    isRTL && "text-right"
                                )}>
                                    {statsLoading ? (
                                        <Spinner className="h-6 w-6" />
                                    ) : (
                                        card.value
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Filters and Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                        isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                        placeholder={t("jobs.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={cn(
                            isRTL ? "pr-10 text-right" : "pl-10"
                        )}
                    />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t("jobs.filterByStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("jobs.allStatuses")}</SelectItem>
                        <SelectItem value="draft">{t("jobs.status.draft")}</SelectItem>
                        <SelectItem value="active">{t("jobs.status.active")}</SelectItem>
                        <SelectItem value="closed">{t("jobs.status.closed")}</SelectItem>
                        <SelectItem value="archived">{t("jobs.status.archived")}</SelectItem>
                    </SelectContent>
                </Select>

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchJobs}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>

                {/* Add Job Button */}
                {hasPermission(currentUserRole, "admin") && (
                    <Button
                        onClick={() => setAddDialogOpen(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                    >
                        <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {t("jobs.addJob")}
                    </Button>
                )}
            </div>

            {/* Jobs Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner className="h-8 w-8 text-primary" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t("jobs.noJobsFound")}</p>
                            <p className="text-sm">{t("jobs.tryAdjusting")}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("jobs.jobTitle")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("jobs.department")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("jobs.applicants")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("common.status")}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("jobs.created")}</TableHead>
                                    <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{job.title}</p>
                                                    <p className="text-muted-foreground text-sm">
                                                        {job.employmentType.replace('-', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {job.department || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/applicants?jobId=${job.id}`}>
                                                <Badge
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                                                >
                                                    <Users className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                                                    {job.applicantsCount || 0}
                                                </Badge>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {(job.status === 'active' || job.status === 'closed') ? (
                                                <Switch
                                                    checked={job.status === 'active'}
                                                    onCheckedChange={(checked) => handleToggleStatus(job, checked)}
                                                />
                                            ) : (
                                                <Badge className={cn("border-0", statusColors[job.status])}>
                                                    {t(`jobs.status.${job.status}`)}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(job.createdAt)}
                                        </TableCell>
                                        <TableCell className={isRTL ? "text-left" : "text-right"}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {/* Copy Application Link */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleCopyApplicationLink(job.id)}
                                                        className="cursor-pointer font-medium"
                                                    >
                                                        <LinkIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("jobs.copyApplicationLink")}
                                                    </DropdownMenuItem>

                                                    {/* Preview Page */}
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/apply/${job.id}`, "_blank")}
                                                        className="cursor-pointer"
                                                    >
                                                        <ExternalLink className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("jobs.previewPage")}
                                                    </DropdownMenuItem>

                                                    {/* Questions Builder */}
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/jobs/${job.id}/questions`} className="cursor-pointer">
                                                            <FileQuestion className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                            {t("jobs.questions")}
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Edit */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditJob(job)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Pencil className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("common.edit")}
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Delete */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteJob(job)}
                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                        {t("common.delete")}
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
                                {t("common.showing")} {jobs.length} {t("common.of")} {total}
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

            {/* Dialogs */}
            <JobWizardDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={fetchJobs}
                userId={userId}
            />

            {selectedJob && (
                <>
                    <ViewJobDialog
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                        job={selectedJob}
                    />
                    <DeleteJobDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                        job={selectedJob}
                        onSuccess={fetchJobs}
                        userId={userId}
                    />
                </>
            )}
        </div>
    )
}
