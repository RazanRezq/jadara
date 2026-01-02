import type { UserRole } from "@/lib/auth"

// ═══════════════════════════════════════════════════════════════════════════════
// THE "GOLDEN LIST" - EXACTLY 5 STATUSES
// These are the ONLY valid statuses exposed to the frontend.
// API normalizes any legacy statuses before sending to client.
// ═══════════════════════════════════════════════════════════════════════════════
export type ApplicantStatus =
    | 'new'           // Just submitted, AI scored but awaiting human review
    | 'evaluated'     // Reviewed by a team member
    | 'interview'     // In interview process
    | 'hired'         // Final positive outcome
    | 'rejected'      // Final negative outcome

// Status display order for UI components
export const STATUS_ORDER: ApplicantStatus[] = ['new', 'evaluated', 'interview', 'hired', 'rejected']

export type ViewMode = 'list' | 'board'

// AI Evaluation status - tracks background evaluation progress
export type EvaluationStatusType = 'pending' | 'processing' | 'completed' | 'failed'

export interface Applicant {
    id: string
    jobId: { _id: string; title: string; currency?: string }
    // NORMALIZED: Always provided by API for UI consistency
    displayName: string
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
    evaluationStatus?: EvaluationStatusType
    evaluationError?: string
    isSuspicious: boolean
    isComplete: boolean
    submittedAt?: string
    createdAt: string
    // Interview data (when includeRelations is true and applicant has a scheduled interview)
    interview?: {
        id: string
        scheduledDate: string
        scheduledTime: string
        duration: number
        meetingLink: string
        notes?: string
        status: 'scheduled' | 'confirmed'
    }
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
            averageRelevanceScore?: number
            averageCommunicationScore?: number
            responses: Array<{
                questionText: string
                weight: number
                transcriptLength: number
                transcript?: string
                sentiment: string
                confidence: number
                // Enhanced fields
                relevanceScore?: number
                communicationScore?: number
                keyPointsMentioned?: BilingualTextArray
                strengthsInResponse?: BilingualTextArray
                areasForImprovement?: BilingualTextArray
                redFlagsInResponse?: BilingualTextArray
                specificFeedback?: BilingualText
                aiReasoning: BilingualText
            }>
            overallImpact: BilingualText
            overallStrengths?: BilingualTextArray
            overallWeaknesses?: BilingualTextArray
        }
        textResponsesAnalysis?: {
            totalResponses: number
            totalWeight: number
            averageRelevanceScore?: number
            averageContentQuality?: string
            responses: Array<{
                questionText: string
                weight: number
                wordCount: number
                quality: string
                answer?: string
                // Enhanced fields
                relevanceScore?: number
                communicationScore?: number
                keyPointsMentioned?: BilingualTextArray
                strengthsInResponse?: BilingualTextArray
                areasForImprovement?: BilingualTextArray
                redFlagsInResponse?: BilingualTextArray
                specificFeedback?: BilingualText
                aiReasoning: BilingualText
            }>
            overallImpact: BilingualText
            overallStrengths?: BilingualTextArray
            overallWeaknesses?: BilingualTextArray
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

export interface ApplicantsFilterState {
    searchTerm: string
    statusFilters: Set<string>
    jobFilter: string
    minScore: number
    experienceRange: [number, number]
    selectedSkills: Set<string>
}

// Reviewer badge info for transparency display
export interface ReviewerBadge {
    reviewerId: string
    reviewerName: string
    reviewerRole: 'reviewer' | 'admin' | 'superadmin'
    rating: number
    decision: string
}

// Map of applicant ID to array of reviewer badges
export type ReviewsByApplicant = Map<string, ReviewerBadge[]>

export interface ApplicantsViewProps {
    userRole: UserRole
    userId: string
}

// Kanban column configuration
export interface KanbanColumn {
    id: string
    title: string
    statuses: ApplicantStatus[]
    color: string
    bgColor: string
}

// Blind mode helper - determines what data to hide based on role
export function isReviewer(role: UserRole): boolean {
    return role === 'reviewer'
}

// Fields hidden from reviewers (blind mode)
export function shouldHideSensitiveData(role: UserRole): boolean {
    return isReviewer(role)
}
