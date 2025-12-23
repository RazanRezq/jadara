"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type UserRole } from "@/lib/auth"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Search,
    RefreshCw,
    Users,
    Sparkles,
    Filter,
    Building2,
    X,
} from "lucide-react"
import { CandidateCard } from "./candidate-card"
import { DashboardStats } from "./dashboard-stats"
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
        screeningAnswers?: Record<string, boolean>
        languageProficiency?: Record<string, string>
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

// Bilingual content types
export interface BilingualText {
    en: string
    ar: string
}

export interface BilingualTextArray {
    en: string[]
    ar: string[]
}

export interface EvaluationData {
    id: string
    applicantId: string
    overallScore: number
    recommendation: 'hire' | 'hold' | 'reject' | 'pending'
    // Bilingual content fields
    strengths: BilingualTextArray
    weaknesses: BilingualTextArray
    redFlags: BilingualTextArray
    summary: BilingualText
    recommendationReason: BilingualText
    suggestedQuestions: BilingualTextArray
    criteriaMatches: Array<{
        criteriaName: string
        matched: boolean
        score: number
        reason: BilingualText
    }>
    sentimentScore?: number
    confidenceScore?: number
    // New detailed analysis fields
    voiceAnalysisDetails?: Array<{
        questionId: string
        questionText: string
        questionWeight: number
        rawTranscript: string
        cleanTranscript: string
        sentiment?: {
            score: number
            label: 'negative' | 'neutral' | 'positive'
        }
        confidence?: {
            score: number
            indicators: string[]
        }
        fluency?: {
            score: number
            wordsPerMinute?: number
            fillerWordCount?: number
        }
        keyPhrases?: string[]
    }>
    socialProfileInsights?: {
        linkedin?: {
            headline?: string
            summary?: string
            skills: string[]
            experience: Array<{
                title: string
                company: string
                duration?: string
            }>
            highlights: string[]
        }
        github?: {
            repositories: number
            stars: number
            languages: string[]
            topProjects: Array<{
                name: string
                description: string
                stars: number
            }>
            highlights: string[]
        }
        portfolio?: {
            projects: Array<{
                name: string
                description: string
                technologies: string[]
            }>
            skills: string[]
            highlights: string[]
        }
        overallHighlights: string[]
    }
    textResponseAnalysis?: {
        totalResponses: number
        responses: Array<{
            questionId: string
            questionText: string
            questionWeight: number
            answer: string
            wordCount: number
            quality: 'poor' | 'average' | 'good' | 'excellent'
        }>
        overallQuality: 'poor' | 'average' | 'good' | 'excellent'
        insights: string[]
    }
    // AI Analysis Breakdown - Shows transparency of AI decisions
    aiAnalysisBreakdown?: {
        screeningQuestionsAnalysis?: {
            totalQuestions: number
            knockoutQuestions: number
            failedKnockouts: Array<{
                question: string
                answer: boolean
                impact: string
            }>
            passedQuestions: string[]
            aiReasoning: BilingualText
        }
        voiceResponsesAnalysis?: {
            totalResponses: number
            totalWeight: number
            responses: Array<{
                questionText: string
                weight: number
                transcriptLength: number
                sentiment: string
                confidence: number
                aiReasoning: BilingualText
            }>
            overallImpact: BilingualText
        }
        textResponsesAnalysis?: {
            totalResponses: number
            totalWeight: number
            responses: Array<{
                questionText: string
                weight: number
                wordCount: number
                quality: string
                aiReasoning: BilingualText
            }>
            overallImpact: BilingualText
        }
        additionalNotesAnalysis?: {
            notesProvided: boolean
            notesLength: number
            aiReasoning: BilingualText
            keyPointsExtracted: string[]
        }
        externalProfilesAnalysis?: {
            linkedinAnalyzed: boolean
            githubAnalyzed: boolean
            portfolioAnalyzed: boolean
            skillsDiscovered: number
            projectsFound: number
            aiReasoning: BilingualText
        }
        languageRequirementsAnalysis?: {
            totalLanguages: number
            meetsAllRequirements: boolean
            gaps: Array<{
                language: string
                required: string
                candidate: string
                gapLevel: number
            }>
            aiReasoning: BilingualText
        }
        experienceAnalysis?: {
            selfReported: number
            required: number
            meetsRequirement: boolean
            gap?: number
            aiReasoning: BilingualText
        }
        scoringBreakdown?: {
            criteriaWeights: Array<{
                criteriaName: string
                weight: number
                score: number
                contribution: number
                aiReasoning: BilingualText
            }>
            totalWeightedScore: number
            aiSummary: BilingualText
        }
    }
}

interface ApplicantsClientProps {
    currentUserRole: UserRole
    userId: string
}

// Available skills for filtering
const SKILL_OPTIONS = [
    "React", "Node.js", "TypeScript", "Python", "Angular", "Vue.js",
    "Docker", "AWS", "Java", "GraphQL"
]

export function ApplicantsClient({ currentUserRole, userId }: ApplicantsClientProps) {
    const { t, isRTL } = useTranslate()
    const searchParams = useSearchParams()
    const jobIdFromUrl = searchParams.get("jobId")

    // Data states
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [evaluations, setEvaluations] = useState<Map<string, EvaluationData>>(new Map())
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
    const [jobFilter, setJobFilter] = useState<string>(jobIdFromUrl || "all")
    const [minScore, setMinScore] = useState<number>(0)
    const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20])
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())

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

    // Request deduplication refs
    const isFetchingApplicants = useRef(false)
    const isFetchingJobs = useRef(false)

    // Fetch jobs list
    const fetchJobs = useCallback(async () => {
        // Skip if already fetching (prevents Strict Mode duplicates)
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
            // Use batch endpoint - single request instead of N requests
            const response = await fetch(`/api/evaluations/batch-by-applicants?role=${currentUserRole}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantIds })
            })
            const data = await response.json()

            if (data.success && data.evaluations) {
                // Convert object to Map
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

    // Fetch applicants with evaluations
    const fetchApplicants = useCallback(async () => {
        // Skip if already fetching (prevents Strict Mode duplicates)
        if (isFetchingApplicants.current) return
        isFetchingApplicants.current = true

        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
                role: currentUserRole,
            })
            if (searchTerm) params.append("search", searchTerm)
            if (statusFilters.size > 0 && !statusFilters.has("all")) {
                params.append("status", Array.from(statusFilters)[0])
            }
            if (jobFilter && jobFilter !== "all") params.append("jobId", jobFilter)
            if (minScore > 0) params.append("minScore", minScore.toString())

            const response = await fetch(`/api/applicants/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setApplicants(data.applicants)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)

                // Fetch evaluations for applicants
                const applicantIds = data.applicants.map((a: Applicant) => a.id)
                await fetchEvaluations(applicantIds)

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
                    topMissingSkill: "React", // This would come from aggregated data
                })
            }
        } catch (error) {
            console.error("Failed to fetch applicants:", error)
            toast.error(t("common.error"))
        } finally {
            isFetchingApplicants.current = false
            setLoading(false)
        }
    }, [page, searchTerm, statusFilters, jobFilter, minScore, currentUserRole, t, fetchEvaluations])

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

    // Filter handlers
    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const handleStatusToggle = (status: string) => {
        const newFilters = new Set(statusFilters)
        if (newFilters.has(status)) {
            newFilters.delete(status)
        } else {
            newFilters.add(status)
        }
        setStatusFilters(newFilters)
        setPage(1)
    }

    const handleSkillToggle = (skill: string) => {
        const newSkills = new Set(selectedSkills)
        if (newSkills.has(skill)) {
            newSkills.delete(skill)
        } else {
            newSkills.add(skill)
        }
        setSelectedSkills(newSkills)
    }

    const clearAllFilters = () => {
        setSearchTerm("")
        setStatusFilters(new Set())
        setJobFilter("all")
        setMinScore(0)
        setExperienceRange([0, 20])
        setSelectedSkills(new Set())
        setPage(1)
    }

    const handleViewApplicant = (applicant: Applicant) => {
        setSelectedApplicant(applicant)
        setViewDialogOpen(true)
    }

    // Filter applicants client-side for additional filters
    const filteredApplicants = applicants.filter(applicant => {
        // Experience filter
        const exp = applicant.personalData?.yearsOfExperience ?? 0
        if (exp < experienceRange[0] || exp > experienceRange[1]) return false

        // Skills filter (check tags)
        if (selectedSkills.size > 0) {
            const hasSkill = applicant.tags?.some(tag =>
                Array.from(selectedSkills).some(skill =>
                    tag.toLowerCase().includes(skill.toLowerCase())
                )
            )
            if (!hasSkill) return false
        }

        return true
    })

    // Separate recommended candidates
    const recommendedApplicants = filteredApplicants.filter(a => (a.aiScore || 0) >= 75)
    const otherApplicants = filteredApplicants.filter(a => (a.aiScore || 0) < 75)

    const hasActiveFilters = searchTerm || statusFilters.size > 0 || jobFilter !== "all" ||
        minScore > 0 || selectedSkills.size > 0 || experienceRange[0] > 0 || experienceRange[1] < 20

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{t("applicants.smartDashboard")}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Select value={jobFilter} onValueChange={(v) => { setJobFilter(v); setPage(1); }}>
                                    <SelectTrigger className="w-auto h-7 text-xs border-0 bg-transparent hover:bg-muted/50 px-2">
                                        <SelectValue placeholder={t("applicants.selectJob")} />
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
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <Input
                            placeholder={t("applicants.searchPlaceholder")}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={cn("h-10", isRTL ? "pr-10" : "pl-10")}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <DashboardStats stats={stats} />

                {/* AI Recommended Section */}
                {recommendedApplicants.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">{t("applicants.aiRecommendedTitle")}</h2>
                            <Badge variant="secondary" className="text-xs">
                                {recommendedApplicants.length} {t("applicants.candidates")}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {recommendedApplicants.slice(0, 6).map((applicant) => (
                                <CandidateCard
                                    key={applicant.id}
                                    applicant={applicant}
                                    evaluation={evaluations.get(applicant.id)}
                                    onView={handleViewApplicant}
                                    isRecommended
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Candidates Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">{t("applicants.allCandidates")}</h2>
                        <Badge variant="outline" className="text-xs">
                            {otherApplicants.length} {t("applicants.candidates")}
                        </Badge>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner className="h-8 w-8 text-primary" />
                        </div>
                    ) : filteredApplicants.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Users className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">{t("applicants.noApplicantsFound")}</p>
                                <p className="text-sm">{t("applicants.tryAdjusting")}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {otherApplicants.map((applicant) => (
                                <CandidateCard
                                    key={applicant.id}
                                    applicant={applicant}
                                    evaluation={evaluations.get(applicant.id)}
                                    onView={handleViewApplicant}
                                />
                            ))}
                        </div>
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
                </div>
            </div>

            {/* Filters Sidebar */}
            <div className="w-full lg:w-72 shrink-0">
                <Card className="sticky top-4">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                {t("applicants.filters")}
                            </CardTitle>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="h-7 text-xs"
                                >
                                    {t("applicants.clearAll")}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search in filters */}
                        <div className="relative">
                            <Search className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                                isRTL ? "right-3" : "left-3"
                            )} />
                            <Input
                                placeholder={t("applicants.searchCandidate")}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={cn("h-9 text-sm", isRTL ? "pr-9" : "pl-9")}
                            />
                        </div>

                        <Separator />

                        <Accordion type="multiple" defaultValue={["status", "score", "experience", "skills"]} className="w-full">
                            {/* Status Filter */}
                            <AccordionItem value="status" className="border-0">
                                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                                    {t("applicants.applicationStatus")}
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="space-y-2">
                                        {["new", "screening", "interviewing", "evaluated", "shortlisted", "rejected"].map((status) => (
                                            <label
                                                key={status}
                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={statusFilters.has(status)}
                                                    onCheckedChange={() => handleStatusToggle(status)}
                                                />
                                                <span>{t(`applicants.status.${status}`)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Score Filter */}
                            <AccordionItem value="score" className="border-0">
                                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        {t("applicants.matchScore")}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{t("applicants.minScore")}</span>
                                            <span className="font-medium text-primary">{minScore}%</span>
                                        </div>
                                        <Slider
                                            value={[minScore]}
                                            onValueChange={(value) => { setMinScore(value[0]); setPage(1); }}
                                            max={100}
                                            step={5}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Experience Filter */}
                            <AccordionItem value="experience" className="border-0">
                                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                                    {t("applicants.yearsOfExperience")}
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">{t("applicants.from")}</Label>
                                            <Input
                                                type="number"
                                                value={experienceRange[0]}
                                                onChange={(e) => setExperienceRange([parseInt(e.target.value) || 0, experienceRange[1]])}
                                                className="h-8 text-sm mt-1"
                                                min={0}
                                                max={20}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">{t("applicants.to")}</Label>
                                            <Input
                                                type="number"
                                                value={experienceRange[1]}
                                                onChange={(e) => setExperienceRange([experienceRange[0], parseInt(e.target.value) || 20])}
                                                className="h-8 text-sm mt-1"
                                                min={0}
                                                max={20}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Skills Filter */}
                            <AccordionItem value="skills" className="border-0">
                                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                                    {t("applicants.skills")}
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="flex flex-wrap gap-2">
                                        {SKILL_OPTIONS.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant={selectedSkills.has(skill) ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    selectedSkills.has(skill)
                                                        ? "bg-primary"
                                                        : "hover:bg-muted"
                                                )}
                                                onClick={() => handleSkillToggle(skill)}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Separator />

                        {/* Clear Filters Button */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={clearAllFilters}
                            disabled={!hasActiveFilters}
                        >
                            <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("applicants.clearAllFilters")}
                        </Button>

                        {/* Refresh Button */}
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={fetchApplicants}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2", loading && "animate-spin")} />
                            {t("common.refresh")}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* View Dialog */}
            {selectedApplicant && (
                <ViewApplicantDialog
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    applicant={selectedApplicant}
                    evaluation={evaluations.get(selectedApplicant.id)}
                    userRole={currentUserRole}
                    userId={userId}
                    onStatusChange={fetchApplicants}
                />
            )}
        </div>
    )
}
