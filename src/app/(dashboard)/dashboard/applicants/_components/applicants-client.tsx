"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
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
import { type UserRole } from "@/lib/auth"
import { hasPermission } from "@/lib/authClient"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import { X, Archive, Trash2, Users, Sparkles, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// Components
import { ApplicantsToolbar } from "./applicants-toolbar"
import { ApplicantFilters } from "./applicant-filters"
import { ApplicantBoard } from "./applicant-board"
import { ApplicantList, ApplicantListMobile } from "./applicant-list"
import { ApplicantDashboardWidgets } from "@/components/dashboard/applicant-widgets"
import { ViewApplicantDialog } from "./view-applicant-dialog"
import { ScheduleInterviewDialog } from "./schedule-interview-dialog"
import { AIRecommendedSection } from "./ai-recommended-section"
import { ExportButton } from "@/components/export-button"
import { formatApplicantsForExport } from "@/lib/export-utils"

// Types
import type {
    Applicant,
    ApplicantStatus,
    EvaluationData,
    ViewMode,
    ApplicantsFilterState,
    BilingualText,
    BilingualTextArray,
    ReviewerBadge,
    ReviewsByApplicant,
} from "./types"

// Re-export types for backward compatibility
export type { Applicant, ApplicantStatus, EvaluationData, BilingualText, BilingualTextArray }

interface ApplicantsClientProps {
    currentUserRole: UserRole
    userId: string
}

// Default filter state
const defaultFilters: ApplicantsFilterState = {
    searchTerm: "",
    statusFilters: new Set(),
    jobFilter: "all",
    minScore: 0,
    experienceRange: [0, 20],
    selectedSkills: new Set(),
}

export function ApplicantsClient({ currentUserRole, userId }: ApplicantsClientProps) {
    const { t, locale } = useTranslate()
    const searchParams = useSearchParams()
    const jobIdFromUrl = searchParams.get("jobId")
    const statusFromUrl = searchParams.get("status")
    const minScoreFromUrl = searchParams.get("minScore")

    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>('list')

    // Data states
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [evaluations, setEvaluations] = useState<Map<string, EvaluationData>>(new Map())
    const [reviewsByApplicant, setReviewsByApplicant] = useState<ReviewsByApplicant>(new Map())
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [filters, setFilters] = useState<ApplicantsFilterState>(() => ({
        ...defaultFilters,
        jobFilter: jobIdFromUrl || "all",
        statusFilters: statusFromUrl ? new Set([statusFromUrl]) : new Set(),
        minScore: minScoreFromUrl ? parseInt(minScoreFromUrl) : 0,
    }))

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Bulk selection
    const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set())

    // Stats
    const [stats, setStats] = useState({
        totalApplicants: 0,
        aiRecommended: 0,
        averageScore: 0,
        topMissingSkill: "React",
    })

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
    const [selectedTab, setSelectedTab] = useState<string>("overview")
    const [scheduleInterviewDialogOpen, setScheduleInterviewDialogOpen] = useState(false)
    const [applicantForInterview, setApplicantForInterview] = useState<Applicant | null>(null)

    // Alert dialog for bulk operations
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertConfig, setAlertConfig] = useState<{
        title: string
        description: string
        onConfirm: () => void
        variant?: 'default' | 'destructive'
    } | null>(null)

    // AI Evaluation state
    const [isRunningEvaluation, setIsRunningEvaluation] = useState(false)

    // Request deduplication refs
    const isFetchingApplicants = useRef(false)
    const isFetchingJobs = useRef(false)

    // Fetch jobs list
    const fetchJobs = useCallback(async () => {
        if (isFetchingJobs.current) return
        isFetchingJobs.current = true

        try {
            const response = await fetch("/api/jobs/list?limit=100")

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            if (data.success) {
                setJobs(data.jobs.map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })))
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        } finally {
            isFetchingJobs.current = false
        }
    }, [])

    // Fetch applicants with evaluations (OPTIMIZED: Single API call)
    const fetchApplicants = useCallback(async () => {
        if (isFetchingApplicants.current) return
        isFetchingApplicants.current = true

        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
                role: currentUserRole,
                includeRelations: "true", // Fetch evaluations and reviews in single call
            })
            if (filters.searchTerm) params.append("search", filters.searchTerm)
            if (filters.statusFilters.size > 0 && !filters.statusFilters.has("all")) {
                params.append("status", Array.from(filters.statusFilters)[0])
            }
            if (filters.jobFilter && filters.jobFilter !== "all") params.append("jobId", filters.jobFilter)
            if (filters.minScore > 0) params.append("minScore", filters.minScore.toString())

            const response = await fetch(`/api/applicants/list?${params}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                setApplicants(data.applicants)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)

                // OPTIMIZED: Extract evaluations and review badges from response
                const evaluationsMap = new Map<string, EvaluationData>()
                const reviewsMap = new Map<string, any[]>()

                data.applicants.forEach((applicant: any) => {
                    if (applicant.evaluation) {
                        evaluationsMap.set(applicant.id, applicant.evaluation)
                    }
                    if (applicant.reviewBadges && applicant.reviewBadges.length > 0) {
                        reviewsMap.set(applicant.id, applicant.reviewBadges)
                    }
                })

                setEvaluations(evaluationsMap)
                setReviewsByApplicant(reviewsMap)

                // Calculate stats
                const evaluated = data.applicants.filter((a: Applicant) => a.aiScore !== undefined)
                const recommended = data.applicants.filter((a: Applicant) => (a.aiScore || 0) >= 75)
                const avgScore = evaluated.length > 0
                    ? evaluated.reduce((sum: number, a: Applicant) => sum + (a.aiScore || 0), 0) / evaluated.length
                    : 0

                setStats({
                    totalApplicants: data.pagination.total,
                    aiRecommended: recommended.length,
                    averageScore: avgScore,
                    topMissingSkill: "React",
                })
            }
        } catch (error) {
            console.error("Failed to fetch applicants:", error)
            toast.error(t("common.error"))
        } finally {
            isFetchingApplicants.current = false
            setLoading(false)
        }
    }, [page, filters, currentUserRole, t])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    useEffect(() => {
        fetchApplicants()
    }, [fetchApplicants])

    // Clear selections when page changes
    useEffect(() => {
        setSelectedApplicants(new Set())
    }, [page])

    useEffect(() => {
        if (jobIdFromUrl || statusFromUrl || minScoreFromUrl) {
            setFilters(prev => ({
                ...prev,
                jobFilter: jobIdFromUrl || prev.jobFilter,
                statusFilters: statusFromUrl ? new Set([statusFromUrl]) : prev.statusFilters,
                minScore: minScoreFromUrl ? parseInt(minScoreFromUrl) : prev.minScore,
            }))
        }
    }, [jobIdFromUrl, statusFromUrl, minScoreFromUrl])

    // Deep linking: Auto-open applicant dialog from notification
    useEffect(() => {
        const openApplicantId = searchParams.get("open")
        const initialTab = searchParams.get("tab") || "overview"

        if (openApplicantId && applicants.length > 0) {
            const applicant = applicants.find(a => a.id === openApplicantId)
            if (applicant) {
                setSelectedApplicant(applicant)
                setSelectedTab(initialTab)
                setViewDialogOpen(true)
            }
        }
    }, [searchParams, applicants])

    // Filter handlers
    const handleSearchChange = (value: string) => {
        setFilters(prev => ({ ...prev, searchTerm: value }))
        setPage(1)
    }

    const handleJobFilterChange = (jobId: string) => {
        setFilters(prev => ({ ...prev, jobFilter: jobId }))
        setPage(1)
    }

    const handleFiltersChange = (newFilters: ApplicantsFilterState) => {
        setFilters(newFilters)
        setPage(1)
    }

    const clearAllFilters = () => {
        setFilters(defaultFilters)
        setPage(1)
    }

    const handleViewApplicant = (applicant: Applicant) => {
        setSelectedApplicant(applicant)
        setSelectedTab("overview")
        setViewDialogOpen(true)
    }

    const handleScheduleInterview = (applicant: Applicant) => {
        setApplicantForInterview(applicant)
        setScheduleInterviewDialogOpen(true)
    }

    const handleStatusChange = async (applicantId: string, newStatus: ApplicantStatus) => {
        // Optimistic update - update UI immediately
        setApplicants(prev =>
            prev.map(applicant =>
                applicant.id === applicantId
                    ? { ...applicant, status: newStatus }
                    : applicant
            )
        )

        try {
            const response = await fetch(`/api/applicants/${applicantId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            if (data.success) {
                toast.success(t("applicants.statusUpdated"))

                // If status changed to interview, open the schedule interview dialog
                if (newStatus === 'interview') {
                    const applicant = applicants.find(a => a.id === applicantId)
                    if (applicant) {
                        setApplicantForInterview({ ...applicant, status: newStatus })
                        setScheduleInterviewDialogOpen(true)
                    }
                }
            } else {
                // Revert optimistic update on error
                toast.error(data.error || t("common.error"))
                fetchApplicants()
            }
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error(t("common.error"))
            // Revert optimistic update on error
            fetchApplicants()
        }
    }

    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectedApplicants.size === filteredApplicants.length) {
            setSelectedApplicants(new Set())
        } else {
            setSelectedApplicants(new Set(filteredApplicants.map(applicant => applicant.id)))
        }
    }

    const handleSelectApplicant = (applicantId: string) => {
        const newSelected = new Set(selectedApplicants)
        if (newSelected.has(applicantId)) {
            newSelected.delete(applicantId)
        } else {
            newSelected.add(applicantId)
        }
        setSelectedApplicants(newSelected)
    }

    const handleBulkDelete = () => {
        if (selectedApplicants.size === 0) return

        setAlertConfig({
            title: t("applicants.confirmBulkDelete").replace("{count}", selectedApplicants.size.toString()),
            description: t("applicants.confirmBulkDeleteDescription"),
            variant: 'destructive',
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/applicants/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicantIds: Array.from(selectedApplicants) }),
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const data = await response.json()

                    if (data.success) {
                        toast.success(t("applicants.bulkDeleteSuccess").replace("{count}", data.count.toString()))
                        setSelectedApplicants(new Set())
                        fetchApplicants()
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
        if (selectedApplicants.size === 0) return

        setAlertConfig({
            title: t("applicants.confirmBulkArchive").replace("{count}", selectedApplicants.size.toString()),
            description: t("applicants.confirmBulkArchiveDescription"),
            variant: 'default',
            onConfirm: async () => {
                try {
                    const response = await fetch('/api/applicants/bulk-archive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicantIds: Array.from(selectedApplicants) }),
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const data = await response.json()

                    if (data.success) {
                        toast.success(t("applicants.bulkArchiveSuccess").replace("{count}", data.count.toString()))
                        setSelectedApplicants(new Set())
                        fetchApplicants()
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
        if (selectedApplicants.size === 0) return

        try {
            const response = await fetch('/api/applicants/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantIds: Array.from(selectedApplicants), status: newStatus }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(t("applicants.bulkStatusChangeSuccess").replace("{count}", data.count.toString()))
                setSelectedApplicants(new Set())
                fetchApplicants()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to bulk status change:", error)
            toast.error(t("common.error"))
        }
    }

    // Handle running AI evaluation for pending applicants
    const handleRunAIEvaluation = async () => {
        setIsRunningEvaluation(true)
        try {
            // Determine endpoint based on job filter
            const endpoint = filters.jobFilter && filters.jobFilter !== 'all'
                ? `/api/ai/evaluate/process-pending/${filters.jobFilter}`
                : '/api/ai/evaluate/process-all-pending'

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                if (data.results?.total > 0) {
                    toast.success(
                        t("applicants.evaluation.processSuccess")
                            .replace("{count}", data.results.successful.toString())
                    )
                } else {
                    toast.info(t("applicants.evaluation.noPending"))
                }
                // Refresh to show updated data
                fetchApplicants()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to run AI evaluation:", error)
            toast.error(t("common.error"))
        } finally {
            setIsRunningEvaluation(false)
        }
    }

    // Count pending evaluations for button badge
    // Include applicants with explicit 'pending' status OR no evaluationStatus and no aiScore (legacy data)
    const pendingEvaluationCount = applicants.filter(
        a => a.evaluationStatus === 'pending' || (!a.evaluationStatus && !a.aiScore)
    ).length

    // Filter applicants client-side for additional filters
    const filteredApplicants = applicants.filter(applicant => {
        // Experience filter
        const exp = applicant.personalData?.yearsOfExperience ?? 0
        if (exp < filters.experienceRange[0] || exp > filters.experienceRange[1]) return false

        // Skills filter (check tags)
        if (filters.selectedSkills.size > 0) {
            const hasSkill = applicant.tags?.some(tag =>
                Array.from(filters.selectedSkills).some(skill =>
                    tag.toLowerCase().includes(skill.toLowerCase())
                )
            )
            if (!hasSkill) return false
        }

        return true
    })

    // Prepare export data (includes AI evaluations if available)
    const exportData = (() => {
        const applicantsWithEvaluations = filteredApplicants.map(applicant => ({
            ...applicant,
            evaluation: evaluations.get(applicant.id)
        }))

        // Get current language from context
        const { headers, rows } = formatApplicantsForExport(applicantsWithEvaluations, true, locale as 'en' | 'ar')

        return {
            headers,
            rows,
            filename: `Applicants_Export_${new Date().toISOString().split('T')[0]}`
        }
    })()

    return (
        <div className="dashboard-container flex flex-col min-h-screen">
            {/* Page Header */}
            <PageHeader
                titleKey="applicants.title"
                subtitleKey="applicants.subtitle"
            />

            {/* Stats Widgets */}
            <div className="px-4 pb-4">
                <ApplicantDashboardWidgets stats={stats} loading={loading} />
            </div>

            {/* AI Recommended Section - Enhanced with evaluations for intelligent ranking */}
            <div className="px-4">
                {!loading && (
                    <AIRecommendedSection
                        applicants={applicants}
                        evaluations={evaluations}
                        onApplicantClick={handleViewApplicant}
                    />
                )}
            </div>

            {/* Toolbar */}
            <ApplicantsToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchTerm={filters.searchTerm}
                onSearchChange={handleSearchChange}
                jobs={jobs}
                jobFilter={filters.jobFilter}
                onJobFilterChange={handleJobFilterChange}
                filterSlot={
                    <ApplicantFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClearAll={clearAllFilters}
                    />
                }
                exportSlot={
                    <ExportButton
                        data={exportData}
                        variant="outline"
                        size="default"
                        language={locale as 'en' | 'ar'}
                    />
                }
                aiEvaluationSlot={
                    pendingEvaluationCount > 0 && (
                        <Button
                            variant="default"
                            size="default"
                            onClick={handleRunAIEvaluation}
                            disabled={isRunningEvaluation}
                            className="gap-2"
                        >
                            {isRunningEvaluation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {t("applicants.evaluation.runAI")}
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-medium">
                                {pendingEvaluationCount}
                            </span>
                        </Button>
                    )
                }
                totalApplicants={total}
                onRefresh={fetchApplicants}
                isLoading={loading}
            />

            {/* Main Content */}
            <div className="flex-1 p-4 space-y-6">
                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spinner className="h-8 w-8 text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Board View */}
                        {viewMode === 'board' && (
                            <ApplicantBoard
                                applicants={filteredApplicants}
                                evaluations={evaluations}
                                reviewsByApplicant={reviewsByApplicant}
                                onApplicantClick={handleViewApplicant}
                                onStatusChange={handleStatusChange}
                                onScheduleInterview={handleScheduleInterview}
                                userRole={currentUserRole}
                            />
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    {filteredApplicants.length === 0 ? (
                                        <Card>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                                    <Users className="h-12 w-12 mb-4 opacity-50" />
                                                    <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                                                    <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <ApplicantList
                                            applicants={filteredApplicants}
                                            evaluations={evaluations}
                                            onApplicantClick={handleViewApplicant}
                                            userRole={currentUserRole}
                                            selectedApplicants={selectedApplicants}
                                            onSelectAll={handleSelectAll}
                                            onSelectApplicant={handleSelectApplicant}
                                        />
                                    )}
                                </div>

                                {/* Mobile Card List */}
                                <div className="block md:hidden">
                                    {filteredApplicants.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                            <Users className="h-12 w-12 mb-4 opacity-50" />
                                            <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                                            <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                                        </div>
                                    ) : (
                                        <ApplicantListMobile
                                            applicants={filteredApplicants}
                                            evaluations={evaluations}
                                            onApplicantClick={handleViewApplicant}
                                            userRole={currentUserRole}
                                            selectedApplicants={selectedApplicants}
                                            onSelectApplicant={handleSelectApplicant}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    {t("common.previous")}
                                </Button>
                                <span className="text-sm text-muted-foreground px-4">
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
                        )}
                    </>
                )}
            </div>

            {/* View Dialog */}
            {selectedApplicant && (() => {
                const currentIndex = filteredApplicants.findIndex(app => app.id === selectedApplicant.id)
                const nextApplicantId = currentIndex >= 0 && currentIndex < filteredApplicants.length - 1
                    ? filteredApplicants[currentIndex + 1].id
                    : null

                return (
                    <ViewApplicantDialog
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                        applicant={selectedApplicant}
                        evaluation={evaluations.get(selectedApplicant.id)}
                        userRole={currentUserRole}
                        userId={userId}
                        onStatusChange={fetchApplicants}
                        initialTab={selectedTab}
                        nextApplicantId={nextApplicantId}
                    />
                )
            })()}

            {/* Schedule Interview Dialog */}
            {applicantForInterview && (
                <ScheduleInterviewDialog
                    open={scheduleInterviewDialogOpen}
                    onOpenChange={setScheduleInterviewDialogOpen}
                    applicantId={applicantForInterview.id}
                    jobId={typeof applicantForInterview.jobId === 'string' ? applicantForInterview.jobId : applicantForInterview.jobId._id}
                    applicantName={applicantForInterview.personalData.name}
                    applicantEmail={applicantForInterview.personalData.email}
                    existingInterview={applicantForInterview.interview}
                    onSuccess={() => {
                        setScheduleInterviewDialogOpen(false)
                        setApplicantForInterview(null)
                        fetchApplicants()
                    }}
                />
            )}

            {/* Bulk Action Bar */}
            {selectedApplicants.size > 0 && hasPermission(currentUserRole, "applicants.delete") && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[calc(100%-2rem)] max-w-2xl">
                    <Card className="shadow-2xl border-2">
                        <CardContent className="p-4">
                            {/* Mobile Layout */}
                            <div className="md:hidden flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedApplicants.size === filteredApplicants.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <span className="font-medium text-sm">
                                            {selectedApplicants.size} {t("applicants.selectedCount")}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedApplicants(new Set())}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={handleBulkArchive} className="w-full">
                                        <Archive className="h-4 w-4 me-2" />
                                        {t("applicants.bulkArchive")}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="w-full">
                                        <Trash2 className="h-4 w-4 me-2" />
                                        {t("applicants.bulkDelete")}
                                    </Button>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedApplicants.size === filteredApplicants.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <span className="font-medium">
                                        {selectedApplicants.size} {t("applicants.selectedCount")}
                                    </span>
                                </div>

                                <div className="h-6 w-px bg-border" />

                                <div className="flex items-center gap-2">
                                    {/* Bulk Archive */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBulkArchive}
                                    >
                                        <Archive className="h-4 w-4 me-2" />
                                        {t("applicants.bulkArchive")}
                                    </Button>

                                    {/* Bulk Delete */}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="h-4 w-4 me-2" />
                                        {t("applicants.bulkDelete")}
                                    </Button>

                                    {/* Cancel Selection */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedApplicants(new Set())}
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
