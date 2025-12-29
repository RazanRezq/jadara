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
import { Card, CardContent } from "@/components/ui/card"
import { type UserRole } from "@/lib/auth"
import { hasPermission } from "@/lib/authClient"
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
    Star,
    ArrowUpDown,
    ArrowDown,
    X,
    FileText,
    Archive,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeleteJobDialog } from "./delete-job-dialog"
import { ViewJobDialog } from "./view-job-dialog"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { JobDashboardWidgets } from "@/components/dashboard/job-widgets"

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

// Mobile Job Card Component
const JobCard = ({
    job,
    isSelected,
    onSelect,
    onAction,
    canDelete,
    t,
    isRTL,
    formatDate,
    statusColors,
}: {
    job: Job
    isSelected: boolean
    onSelect: (id: string) => void
    onAction: (action: string, job: Job) => void
    canDelete: boolean
    t: (key: string) => string
    isRTL: boolean
    formatDate: (date?: string) => string
    statusColors: Record<JobStatus, string>
}) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    {canDelete && (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onSelect(job.id)}
                            className="mt-1"
                        />
                    )}

                    {/* Job Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0">
                        <Briefcase className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate">{job.title}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {job.employmentType.replace('-', ' ')}
                                </p>
                            </div>

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onAction('copy-link', job)}>
                                        <LinkIcon className="h-4 w-4 me-2" />
                                        {t("jobs.copyApplicationLink")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAction('preview', job)}>
                                        <ExternalLink className="h-4 w-4 me-2" />
                                        {t("jobs.previewPage")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAction('questions', job)}>
                                        <FileQuestion className="h-4 w-4 me-2" />
                                        {t("jobs.questions")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onAction('edit', job)}>
                                        <Pencil className="h-4 w-4 me-2" />
                                        {t("common.edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onAction('delete', job)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 me-2" />
                                        {t("common.delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                            {job.department && (
                                <span className="flex items-center gap-1">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    {job.department}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {job.applicantsCount || 0} {t("jobs.applicants")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(job.createdAt)}
                            </span>
                        </div>

                        {/* Status Badge */}
                        <Badge className={cn("gap-1.5", statusColors[job.status])}>
                            {job.status === 'draft' && <FileText className="h-3 w-3" />}
                            {job.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                            {job.status === 'closed' && <Ban className="h-3 w-3" />}
                            {job.status === 'archived' && <Archive className="h-3 w-3" />}
                            {t(`jobs.status.${job.status}`)}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Helper component for sortable table header
const SortableTableHead = ({
    field,
    label,
    sortField,
    sortOrder,
    onSort,
    className = "",
    align = "start"
}: {
    field: string
    label: string
    sortField: string | null
    sortOrder: 'asc' | 'desc'
    onSort: (field: string) => void
    className?: string
    align?: "start" | "center" | "end"
}) => {
    const isActive = sortField === field
    const justifyClass = align === "start" ? "justify-start" : align === "end" ? "justify-end" : "justify-center"

    return (
        <TableHead
            className={cn("cursor-pointer hover:bg-muted/50 transition-colors select-none", className)}
            onClick={() => onSort(field)}
        >
            <div className={cn("flex items-center gap-1", justifyClass)}>
                <span>{label}</span>
                {isActive ? (
                    sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    )
}

export function JobsClient({ currentUserRole, userId }: JobsClientProps) {
    const { t, locale, isRTL } = useTranslate()
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [departmentFilter, setDepartmentFilter] = useState<string>("all")
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all")
    const [sortField, setSortField] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Bulk selection
    const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)

    // Alert dialog for bulk operations
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertConfig, setAlertConfig] = useState<{
        title: string
        description: string
        onConfirm: () => void
        variant?: 'default' | 'destructive'
    } | null>(null)

    const fetchJobs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            })
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
            if (departmentFilter && departmentFilter !== "all") params.append("department", departmentFilter)
            if (employmentTypeFilter && employmentTypeFilter !== "all") params.append("employmentType", employmentTypeFilter)
            if (sortField) {
                params.append("sortBy", sortField)
                params.append("sortOrder", sortOrder)
            }

            const response = await fetch(`/api/jobs/list?${params}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

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
    }, [page, searchTerm, statusFilter, departmentFilter, employmentTypeFilter, sortField, sortOrder, t])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    // Clear selections when page changes
    useEffect(() => {
        setSelectedJobs(new Set())
    }, [page])

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        setPage(1)
    }

    const handleDepartmentFilter = (value: string) => {
        setDepartmentFilter(value)
        setPage(1)
    }

    const handleEmploymentTypeFilter = (value: string) => {
        setEmploymentTypeFilter(value)
        setPage(1)
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Toggle sort order or clear
            if (sortOrder === 'asc') {
                setSortOrder('desc')
            } else if (sortOrder === 'desc') {
                setSortField(null)
            }
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
        setPage(1)
    }

    const handleClearFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setDepartmentFilter("all")
        setEmploymentTypeFilter("all")
        setSortField(null)
        setPage(1)
    }

    const handleSelectAll = () => {
        if (selectedJobs.size === jobs.length) {
            setSelectedJobs(new Set())
        } else {
            setSelectedJobs(new Set(jobs.map(job => job.id)))
        }
    }

    const handleSelectJob = (jobId: string) => {
        const newSelected = new Set(selectedJobs)
        if (newSelected.has(jobId)) {
            newSelected.delete(jobId)
        } else {
            newSelected.add(jobId)
        }
        setSelectedJobs(newSelected)
    }

    const handleBulkDelete = () => {
        if (selectedJobs.size === 0) return

        setAlertConfig({
            title: t("jobs.confirmBulkDelete").replace("{count}", selectedJobs.size.toString()),
            description: t("jobs.confirmBulkDeleteDescription"),
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/jobs/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobIds: Array.from(selectedJobs) }),
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const data = await response.json()

                    if (data.success) {
                        toast.success(t("jobs.bulkDeleteSuccess").replace("{count}", data.count.toString()))
                        setSelectedJobs(new Set())
                        fetchJobs()
                    } else {
                        toast.error(data.error || t("common.error"))
                    }
                } catch (error) {
                    console.error("Failed to bulk delete:", error)
                    toast.error(t("common.error"))
                }
            }
        })
        setAlertOpen(true)
    }

    const handleBulkArchive = () => {
        if (selectedJobs.size === 0) return

        setAlertConfig({
            title: t("jobs.confirmBulkArchive").replace("{count}", selectedJobs.size.toString()),
            description: t("jobs.confirmBulkArchiveDescription"),
            variant: 'default',
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/jobs/bulk-archive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobIds: Array.from(selectedJobs) }),
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const data = await response.json()

                    if (data.success) {
                        toast.success(t("jobs.bulkArchiveSuccess").replace("{count}", data.count.toString()))
                        setSelectedJobs(new Set())
                        fetchJobs()
                    } else {
                        toast.error(data.error || t("common.error"))
                    }
                } catch (error) {
                    console.error("Failed to bulk archive:", error)
                    toast.error(t("common.error"))
                }
            }
        })
        setAlertOpen(true)
    }

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedJobs.size === 0) return

        try {
            const response = await fetch('/api/jobs/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds: Array.from(selectedJobs), status: newStatus }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(t("jobs.bulkStatusChangeSuccess").replace("{count}", data.count.toString()))
                setSelectedJobs(new Set())
                fetchJobs()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to bulk status change:", error)
            toast.error(t("common.error"))
        }
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

    const handleCardAction = (action: string, job: Job) => {
        switch (action) {
            case 'copy-link':
                handleCopyApplicationLink(job.id)
                break
            case 'preview':
                window.open(`/apply/${job.id}`, "_blank")
                break
            case 'questions':
                router.push(`/dashboard/jobs/${job.id}/questions`)
                break
            case 'edit':
                handleEditJob(job)
                break
            case 'delete':
                handleDeleteJob(job)
                break
            case 'activate':
                handleToggleStatus(job, true)
                break
            case 'close':
                handleToggleStatus(job, false)
                break
        }
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(
                    newStatus === 'active'
                        ? t("jobs.hiringActivated")
                        : t("jobs.hiringClosed")
                )
                // Refresh to get latest data
                fetchJobs()
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
        return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t("jobs.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("jobs.subtitle")}
                    </p>
                </div>
            </div>

            {/* Dashboard Widgets */}
            <JobDashboardWidgets />

            {/* Filters and Actions Bar */}
            <div className="flex flex-col gap-4">
                {/* First Row: Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
                        <Input
                            placeholder={t("jobs.searchPlaceholder")}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="ps-10"
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

                    {/* Department Filter */}
                    <Select value={departmentFilter} onValueChange={handleDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t("jobs.filterByDepartment")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("jobs.allDepartments")}</SelectItem>
                            <SelectItem value="Engineering">Engineering</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Employment Type Filter */}
                    <Select value={employmentTypeFilter} onValueChange={handleEmploymentTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t("jobs.filterByEmploymentType")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("jobs.allEmploymentTypes")}</SelectItem>
                            <SelectItem value="full-time">{t("jobs.fullTime")}</SelectItem>
                            <SelectItem value="part-time">{t("jobs.partTime")}</SelectItem>
                            <SelectItem value="contract">{t("jobs.contract")}</SelectItem>
                            <SelectItem value="internship">{t("jobs.internship")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clear Filters Button */}
                    {(searchTerm || statusFilter !== "all" || departmentFilter !== "all" || employmentTypeFilter !== "all" || sortField) && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClearFilters}
                            title={t("jobs.clearFilters")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

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
                    {hasPermission(currentUserRole, "jobs.create") && (
                        <Button
                            onClick={() => router.push("/dashboard/jobs/create")}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        >
                            <Plus className="h-4 w-4 me-2" />
                            {t("jobs.addJob")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
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
                    <>
                        <div className="space-y-3">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    isSelected={selectedJobs.has(job.id)}
                                    onSelect={handleSelectJob}
                                    onAction={handleCardAction}
                                    canDelete={hasPermission(currentUserRole, "jobs.delete")}
                                    t={t}
                                    isRTL={isRTL}
                                    formatDate={formatDate}
                                    statusColors={statusColors}
                                />
                            ))}
                        </div>

                        {/* Mobile Pagination */}
                        {totalPages > 1 && (
                            <Card className="mt-4">
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-muted-foreground text-center">
                                            {t("common.showing")} {jobs.length} {t("common.of")} {total}
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                {t("common.previous")}
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-2">
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
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block">
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
                        <Table className="w-full table-auto font-ibm-plex">
                            <TableHeader>
                                <TableRow className="border-b">
                                    {/* Checkbox Column */}
                                    {hasPermission(currentUserRole, "jobs.delete") && (
                                        <TableHead className="w-12 px-4">
                                            <Checkbox
                                                checked={selectedJobs.size === jobs.length && jobs.length > 0}
                                                onCheckedChange={handleSelectAll}
                                                aria-label={t("jobs.selectAll")}
                                            />
                                        </TableHead>
                                    )}

                                    {/* Job Title - Sortable */}
                                    <SortableTableHead
                                        field="title"
                                        label={t("jobs.jobTitle")}
                                        sortField={sortField}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                        className="px-6 min-w-[250px]"
                                        align="start"
                                    />

                                    {/* Department - Sortable */}
                                    <SortableTableHead
                                        field="department"
                                        label={t("jobs.department")}
                                        sortField={sortField}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                        className="px-6"
                                        align="start"
                                    />

                                    {/* Applicants - Sortable */}
                                    <SortableTableHead
                                        field="applicantsCount"
                                        label={t("jobs.applicants")}
                                        sortField={sortField}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                        className="px-6"
                                        align="start"
                                    />

                                    {/* Status */}
                                    <TableHead className="px-6 text-start">
                                        {t("common.status")}
                                    </TableHead>

                                    {/* Created - Sortable */}
                                    <SortableTableHead
                                        field="createdAt"
                                        label={t("jobs.created")}
                                        sortField={sortField}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                        className="px-6"
                                        align="start"
                                    />

                                    {/* Actions */}
                                    <TableHead className="px-6 text-end">
                                        {t("common.actions")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow
                                        key={job.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                                    >
                                        {/* Checkbox Cell */}
                                        {hasPermission(currentUserRole, "jobs.delete") && (
                                            <TableCell className="px-4">
                                                <Checkbox
                                                    checked={selectedJobs.has(job.id)}
                                                    onCheckedChange={() => handleSelectJob(job.id)}
                                                    aria-label={`Select ${job.title}`}
                                                />
                                            </TableCell>
                                        )}

                                        {/* Job Title Cell */}
                                        <TableCell
                                            className="px-6 py-4"
                                            dir={isRTL ? "rtl" : "ltr"}
                                        >
                                            <div className="flex items-center gap-3 justify-start">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-sm">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{job.title}</p>
                                                    <p className="text-muted-foreground text-sm capitalize">
                                                        {job.employmentType.replace('-', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Department Cell */}
                                        <TableCell className="px-6 py-4 text-start text-muted-foreground">
                                            {job.department || "-"}
                                        </TableCell>

                                        {/* Applicants Cell */}
                                        <TableCell className="px-6 py-4 text-start">
                                            <Link href={`/dashboard/applicants?jobId=${job.id}`}>
                                                <Badge
                                                    variant="outline"
                                                    className="inline-flex items-center cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                                                >
                                                    <Users className="h-3 w-3 me-1" />
                                                    {job.applicantsCount || 0}
                                                </Badge>
                                            </Link>
                                        </TableCell>

                                        {/* Status Cell */}
                                        <TableCell className="px-6 py-4 text-start">
                                            <Badge className={cn("inline-flex border-0 gap-1.5", statusColors[job.status])}>
                                                {job.status === 'draft' && <FileText className="h-3 w-3" />}
                                                {job.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                                                {job.status === 'closed' && <Ban className="h-3 w-3" />}
                                                {job.status === 'archived' && <Archive className="h-3 w-3" />}
                                                {t(`jobs.status.${job.status}`)}
                                            </Badge>
                                        </TableCell>

                                        {/* Created Date Cell */}
                                        <TableCell className="px-6 py-4 text-start text-muted-foreground">
                                            {formatDate(job.createdAt)}
                                        </TableCell>

                                        {/* Actions Cell */}
                                        <TableCell className="px-6 py-4 text-end">
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
                                                        <LinkIcon className="h-4 w-4 me-2" />
                                                        {t("jobs.copyApplicationLink")}
                                                    </DropdownMenuItem>

                                                    {/* Preview Page */}
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/apply/${job.id}`, "_blank")}
                                                        className="cursor-pointer"
                                                    >
                                                        <ExternalLink className="h-4 w-4 me-2" />
                                                        {t("jobs.previewPage")}
                                                    </DropdownMenuItem>

                                                    {/* Questions Builder */}
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/jobs/${job.id}/questions`} className="cursor-pointer">
                                                            <FileQuestion className="h-4 w-4 me-2" />
                                                            {t("jobs.questions")}
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Edit */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditJob(job)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Pencil className="h-4 w-4 me-2" />
                                                        {t("common.edit")}
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Delete */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteJob(job)}
                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4 me-2" />
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

            {/* Bulk Action Bar */}
            {selectedJobs.size > 0 && hasPermission(currentUserRole, "jobs.delete") && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[calc(100%-2rem)] max-w-2xl">
                    <Card className="shadow-2xl border-2">
                        <CardContent className="p-4">
                            {/* Mobile Layout */}
                            <div className="md:hidden flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedJobs.size === jobs.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <span className="font-medium text-sm">
                                            {selectedJobs.size} {t("jobs.selectedCount")}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedJobs(new Set())}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Activity className="h-4 w-4 me-2" />
                                                {t("common.status")}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                                                <CheckCircle2 className="h-4 w-4 me-2 text-green-600" />
                                                {t("jobs.status.active")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('closed')}>
                                                <Ban className="h-4 w-4 me-2 text-amber-600" />
                                                {t("jobs.status.closed")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                                                <FileText className="h-4 w-4 me-2 text-slate-600" />
                                                {t("jobs.status.draft")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="outline" size="sm" onClick={handleBulkArchive} className="w-full">
                                        <Archive className="h-4 w-4 me-2" />
                                        {t("jobs.bulkArchive")}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="w-full col-span-2">
                                        <Trash2 className="h-4 w-4 me-2" />
                                        {t("jobs.bulkDelete")}
                                    </Button>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedJobs.size === jobs.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <span className="font-medium">
                                        {selectedJobs.size} {t("jobs.selectedCount")}
                                    </span>
                                </div>

                                <div className="h-6 w-px bg-border" />

                                <div className="flex items-center gap-2">
                                    {/* Bulk Status Change */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Activity className="h-4 w-4 me-2" />
                                                {t("jobs.bulkChangeStatus")}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                                                <CheckCircle2 className="h-4 w-4 me-2 text-green-600" />
                                                {t("jobs.status.active")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('closed')}>
                                                <Ban className="h-4 w-4 me-2 text-amber-600" />
                                                {t("jobs.status.closed")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                                                <FileText className="h-4 w-4 me-2 text-slate-600" />
                                                {t("jobs.status.draft")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Bulk Archive */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBulkArchive}
                                    >
                                        <Archive className="h-4 w-4 me-2" />
                                        {t("jobs.bulkArchive")}
                                    </Button>

                                    {/* Bulk Delete */}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="h-4 w-4 me-2" />
                                        {t("jobs.bulkDelete")}
                                    </Button>

                                    {/* Cancel Selection */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedJobs(new Set())}
                                    >
                                        <X className="h-4 w-4 me-2" />
                                        {t("common.cancel")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Dialogs */}
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

            {/* Custom Alert Dialog for Bulk Operations */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertConfig?.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertConfig?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                alertConfig?.onConfirm()
                                setAlertOpen(false)
                            }}
                            className={alertConfig?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                        >
                            {t("common.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
