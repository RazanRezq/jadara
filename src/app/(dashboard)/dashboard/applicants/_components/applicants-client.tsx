"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { type UserRole } from "@/lib/auth"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"

// Components
import { ApplicantsToolbar } from "./applicants-toolbar"
import { ApplicantFilters } from "./applicant-filters"
import { ApplicantBoard } from "./applicant-board"
import { ApplicantList, ApplicantListMobile } from "./applicant-list"
import { DashboardStats } from "./dashboard-stats"
import { ViewApplicantDialog } from "./view-applicant-dialog"

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
    const { t } = useTranslate()
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

    // Request deduplication refs
    const isFetchingApplicants = useRef(false)
    const isFetchingJobs = useRef(false)

    // Fetch jobs list
    const fetchJobs = useCallback(async () => {
        if (isFetchingJobs.current) return
        isFetchingJobs.current = true

        try {
            const response = await fetch("/api/jobs/list?limit=100")
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

    // Fetch evaluation data for applicants using batch endpoint
    const fetchEvaluations = useCallback(async (applicantIds: string[]) => {
        if (applicantIds.length === 0) {
            setEvaluations(new Map())
            return
        }

        try {
            const response = await fetch(`/api/evaluations/batch-by-applicants?role=${currentUserRole}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantIds })
            })
            const data = await response.json()

            if (data.success && data.evaluations) {
                const evaluationsMap = new Map<string, EvaluationData>(
                    Object.entries(data.evaluations)
                )
                setEvaluations(evaluationsMap)
            } else {
                setEvaluations(new Map())
            }
        } catch (error) {
            console.error("Failed to fetch evaluations:", error)
            setEvaluations(new Map())
        }
    }, [currentUserRole])

    // Fetch reviewer badges for applicants (for transparency display)
    const fetchReviewBadges = useCallback(async (applicantIds: string[]) => {
        if (applicantIds.length === 0) {
            setReviewsByApplicant(new Map())
            return
        }

        try {
            const response = await fetch('/api/reviews/batch-badges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantIds })
            })
            const data = await response.json()

            if (data.success && data.reviewsByApplicant) {
                const reviewsMap = new Map<string, ReviewerBadge[]>(
                    Object.entries(data.reviewsByApplicant)
                )
                setReviewsByApplicant(reviewsMap)
            } else {
                setReviewsByApplicant(new Map())
            }
        } catch (error) {
            console.error("Failed to fetch review badges:", error)
            setReviewsByApplicant(new Map())
        }
    }, [])

    // Fetch applicants with evaluations
    const fetchApplicants = useCallback(async () => {
        if (isFetchingApplicants.current) return
        isFetchingApplicants.current = true

        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
                role: currentUserRole,
            })
            if (filters.searchTerm) params.append("search", filters.searchTerm)
            if (filters.statusFilters.size > 0 && !filters.statusFilters.has("all")) {
                params.append("status", Array.from(filters.statusFilters)[0])
            }
            if (filters.jobFilter && filters.jobFilter !== "all") params.append("jobId", filters.jobFilter)
            if (filters.minScore > 0) params.append("minScore", filters.minScore.toString())

            const response = await fetch(`/api/applicants/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setApplicants(data.applicants)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)

                // Fetch evaluations and review badges for applicants
                const applicantIds = data.applicants.map((a: Applicant) => a.id)
                await Promise.all([
                    fetchEvaluations(applicantIds),
                    fetchReviewBadges(applicantIds)
                ])

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
    }, [page, filters, currentUserRole, t, fetchEvaluations, fetchReviewBadges])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    useEffect(() => {
        fetchApplicants()
    }, [fetchApplicants])

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

    const handleStatusChange = async (applicantId: string, newStatus: ApplicantStatus) => {
        try {
            const response = await fetch(`/api/applicants/${applicantId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            const data = await response.json()
            if (data.success) {
                toast.success(t("applicants.statusUpdated"))
                fetchApplicants()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error(t("common.error"))
        }
    }

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

    return (
        <div className="flex flex-col min-h-screen">
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
                totalApplicants={total}
                onRefresh={fetchApplicants}
                isLoading={loading}
            />

            {/* Main Content */}
            <div className="flex-1 p-4 space-y-6">
                {/* Stats Cards */}
                <DashboardStats stats={stats} />

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
                                userRole={currentUserRole}
                            />
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <ApplicantList
                                        applicants={filteredApplicants}
                                        evaluations={evaluations}
                                        onApplicantClick={handleViewApplicant}
                                        userRole={currentUserRole}
                                    />
                                </div>

                                {/* Mobile Card List */}
                                <div className="block md:hidden">
                                    <ApplicantListMobile
                                        applicants={filteredApplicants}
                                        evaluations={evaluations}
                                        onApplicantClick={handleViewApplicant}
                                        userRole={currentUserRole}
                                    />
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
        </div>
    )
}
