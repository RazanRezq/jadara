/**
 * SmartRecruit AI - Candidate Evaluation Types
 * Central type definitions for the evaluation pipeline
 */

// Bilingual Content Types
export interface BilingualText {
    en: string
    ar: string
}

export interface BilingualTextArray {
    en: string[]
    ar: string[]
}

// Voice Transcription Types
export interface TranscriptionResult {
    success: boolean
    rawTranscript?: string      // Verbatim transcription
    cleanTranscript?: string    // Cleaned version (no fillers, corrected grammar)
    confidence?: number         // 0-1 confidence score
    language?: string           // Detected language
    duration?: number           // Audio duration in seconds
    error?: string
}

export interface VoiceAnalysisResult {
    success: boolean
    sentiment?: {
        score: number           // -1 (negative) to 1 (positive)
        label: 'negative' | 'neutral' | 'positive'
    }
    confidence?: {
        score: number           // 0-100
        indicators: string[]    // e.g., "Clear speech", "Hesitant pauses"
    }
    fluency?: {
        score: number           // 0-100
        wordsPerMinute?: number
        fillerWordCount?: number
    }
    keyPhrases?: string[]       // Important phrases detected
    error?: string
}

// Resume Parser Types
export interface ParsedResume {
    success: boolean
    profile?: {
        summary?: string
        skills: ExtractedSkill[]
        experience: WorkExperience[]
        education: Education[]
        languages: LanguageSkill[]
        certifications: string[]
        links: {
            linkedin?: string
            portfolio?: string
            behance?: string
            github?: string
            other?: string[]
        }
    }
    rawText?: string
    error?: string
}

export interface ExtractedSkill {
    name: string
    category: 'technical' | 'soft' | 'language' | 'tool'
    yearsOfExperience?: number
    proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface WorkExperience {
    title: string
    company: string
    startDate?: string
    endDate?: string           // null for current position
    isCurrent?: boolean
    duration?: string          // e.g., "2 years 3 months"
    responsibilities: string[]
    achievements: string[]
}

export interface Education {
    degree: string
    institution: string
    field?: string
    graduationYear?: string
    gpa?: string
}

export interface LanguageSkill {
    language: string
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native'
}

// Scoring Engine Types
export interface CriteriaMatch {
    criteriaName: string
    matched: boolean
    score: number               // 0-100
    weight: number              // 1-10 importance
    reason: BilingualText       // Explanation of why matched/not matched (bilingual)
    evidence?: BilingualTextArray // Supporting evidence from candidate data (bilingual)
}

export interface ScoringResult {
    success: boolean
    overallScore: number        // 0-100 weighted average
    criteriaMatches: CriteriaMatch[]
    strengths: BilingualTextArray       // Bilingual strengths
    weaknesses: BilingualTextArray      // Bilingual weaknesses
    redFlags: BilingualTextArray        // Bilingual red flags (hidden from reviewers)
    summary: BilingualText              // Bilingual AI-generated summary
    whySection: BilingualText           // Bilingual "Matched X% because..."
    error?: string
}

export interface RecommendationResult {
    success: boolean
    recommendation: 'hire' | 'hold' | 'reject' | 'pending'
    confidence: number          // 0-100 how confident in recommendation
    reason: BilingualText       // Bilingual explanation
    suggestedQuestions: BilingualTextArray // Bilingual follow-up interview questions
    nextBestAction: BilingualText      // Bilingual what to do next
    error?: string
}

// Main Evaluation Types
export interface CandidateEvaluationInput {
    applicantId: string
    jobId: string
    // Candidate data
    personalData: {
        name: string
        email: string
        phone: string
        age?: number
        yearsOfExperience?: number
        salaryExpectation?: number
        linkedinUrl?: string
        behanceUrl?: string
        portfolioUrl?: string
    }
    // Voice responses
    voiceResponses: Array<{
        questionId: string
        questionText: string
        questionWeight: number
        audioUrl: string
    }>
    // Text responses
    textResponses: Array<{
        questionId: string
        questionText: string
        answer: string
    }>
    // Files
    cvUrl?: string
    // Job criteria (from job document)
    jobCriteria: {
        title: string
        description: string
        skills: Array<{
            name: string
            importance: 'required' | 'preferred'
            type?: 'technical' | 'soft'
        }>
        minExperience: number
        languages: Array<{
            language: string
            level: 'beginner' | 'intermediate' | 'advanced' | 'native'
        }>
        criteria: Array<{
            name: string
            description: string
            weight: number
            required: boolean
        }>
        salaryMin?: number
        salaryMax?: number
        autoRejectThreshold: number
    }
}

export interface CandidateEvaluationResult {
    success: boolean
    evaluation?: {
        applicantId: string
        jobId: string
        // Scores
        overallScore: number
        criteriaMatches: CriteriaMatch[]
        // Analysis (bilingual)
        strengths: BilingualTextArray
        weaknesses: BilingualTextArray
        redFlags: BilingualTextArray
        summary: BilingualText
        // Recommendation (bilingual)
        recommendation: 'hire' | 'hold' | 'reject' | 'pending'
        recommendationReason: BilingualText
        suggestedQuestions: BilingualTextArray
        // Sentiment
        sentimentScore?: number
        confidenceScore?: number
        // Transcripts (per question)
        transcripts: Array<{
            questionId: string
            rawTranscript: string
            cleanTranscript: string
        }>
        // Parsed resume
        parsedResume?: ParsedResume['profile']
    }
    error?: string
    processingTime?: number     // in milliseconds
}

// Job budget check for red flags
export interface BudgetCheckResult {
    withinBudget: boolean
    salaryExpectation?: number
    budgetMin?: number
    budgetMax?: number
    difference?: number         // How much over/under budget
    redFlag?: string            // Message if over budget
}

// URL Content Extraction Types
export interface ExtractedUrlContent {
    url: string
    type: 'linkedin' | 'github' | 'portfolio' | 'behance' | 'other'
    success: boolean
    content?: {
        summary: string
        highlights: string[]
        skills: string[]
        projects: ProjectInfo[]
        experience: string[]
        rawText?: string
    }
    error?: string
    fetchedAt: Date
}

export interface ProjectInfo {
    name: string
    description: string
    technologies: string[]
    url?: string
    stars?: number
    forks?: number
}

export interface UrlExtractionResult {
    success: boolean
    extractedUrls: ExtractedUrlContent[]
    combinedSummary: string
    totalProjectsFound: number
    allSkills: string[]
    errors: string[]
}

// Processing status for long-running evaluations
export interface EvaluationProgress {
    stage: 'transcribing' | 'parsing_resume' | 'scoring' | 'generating_recommendation' | 'complete' | 'failed'
    progress: number            // 0-100
    currentStep: string
    error?: string
}

// Batch evaluation types
export interface BatchEvaluationInput {
    jobId: string
    applicantIds: string[]
}

export interface BatchEvaluationResult {
    success: boolean
    results: Array<{
        applicantId: string
        success: boolean
        error?: string
    }>
    totalProcessed: number
    totalFailed: number
}

