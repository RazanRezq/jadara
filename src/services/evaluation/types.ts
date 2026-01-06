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

// Detailed Voice Analysis for Frontend Display
export interface DetailedVoiceAnalysis {
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
}

// Social Profile Insights for Frontend Display
export interface SocialProfileInsights {
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

// Text Response Analysis for Frontend Display
export interface TextResponseAnalysis {
    totalResponses: number
    responses: Array<{
        questionId: string
        questionText: string
        questionWeight: number // Weight of this question (1-10)
        answer: string
        wordCount: number
        quality: 'poor' | 'average' | 'good' | 'excellent'
    }>
    overallQuality: 'poor' | 'average' | 'good' | 'excellent'
    insights: string[]
}

// Enhanced Response Analysis - Detailed AI evaluation of each response
export interface EnhancedResponseAnalysis {
    relevanceScore: number // 0-100 - How well does the answer address the question?
    contentQuality: 'poor' | 'average' | 'good' | 'excellent'
    keyPointsMentioned: BilingualTextArray // What specific topics/skills did candidate mention?
    strengthsInResponse: BilingualTextArray // What the candidate did well
    areasForImprovement: BilingualTextArray // What could have been better
    redFlagsInResponse: BilingualTextArray // Any concerning patterns (empty if none)
    communicationScore: number // 0-100 - Clarity, structure, grammar
    technicalAccuracy?: number // 0-100 - For technical questions only
    specificFeedback: BilingualText // Detailed AI feedback on this specific answer
}

// AI Analysis Breakdown - Shows WHAT the AI analyzed and WHY it made decisions
export interface AIAnalysisBreakdown {
    // What screening questions were considered
    screeningQuestionsAnalysis?: {
        totalQuestions: number
        knockoutQuestions: number
        failedKnockouts: Array<{
            question: string
            answer: boolean
            impact: string // e.g., "Critical - Auto-reject trigger"
        }>
        passedQuestions: string[]
        aiReasoning: BilingualText // Why screening answers affected the score
    }
    // What voice responses were analyzed - ENHANCED
    voiceResponsesAnalysis?: {
        totalResponses: number
        totalWeight: number // Sum of all voice question weights
        averageRelevanceScore: number // 0-100 average across all responses
        averageCommunicationScore: number // 0-100 average
        responses: Array<{
            questionText: string
            weight: number
            transcriptLength: number
            transcript: string // The actual transcript for context
            sentiment: string // e.g., "positive", "neutral"
            confidence: number // 0-100
            // ENHANCED fields
            relevanceScore: number // 0-100 - How well does answer address question?
            communicationScore: number // 0-100 - Clarity, fluency, structure
            keyPointsMentioned: BilingualTextArray // Specific topics/skills mentioned
            strengthsInResponse: BilingualTextArray // What was done well
            areasForImprovement: BilingualTextArray // What could be better
            redFlagsInResponse: BilingualTextArray // Concerning patterns
            specificFeedback: BilingualText // Detailed feedback for this answer
            aiReasoning: BilingualText // Why this response affected the score
        }>
        overallImpact: BilingualText // How voice responses influenced final score
        overallStrengths: BilingualTextArray // Summary of communication strengths
        overallWeaknesses: BilingualTextArray // Summary of communication weaknesses
    }
    // What text responses were analyzed - ENHANCED
    textResponsesAnalysis?: {
        totalResponses: number
        totalWeight: number // Sum of all text question weights
        averageRelevanceScore: number // 0-100 average across all responses
        averageContentQuality: string // 'poor' | 'average' | 'good' | 'excellent'
        responses: Array<{
            questionText: string
            weight: number
            wordCount: number
            quality: string
            answer: string // The actual answer for context
            // ENHANCED fields
            relevanceScore: number // 0-100 - How well does answer address question?
            communicationScore: number // 0-100 - Writing quality, structure
            keyPointsMentioned: BilingualTextArray // Specific topics/skills mentioned
            strengthsInResponse: BilingualTextArray // What was done well
            areasForImprovement: BilingualTextArray // What could be better
            redFlagsInResponse: BilingualTextArray // Concerning patterns (e.g., copy-paste, generic answers)
            specificFeedback: BilingualText // Detailed feedback for this answer
            aiReasoning: BilingualText // Why this response affected the score
        }>
        overallImpact: BilingualText // How text responses influenced final score
        overallStrengths: BilingualTextArray // Summary of writing strengths
        overallWeaknesses: BilingualTextArray // Summary of writing weaknesses
    }
    // What additional notes were considered
    additionalNotesAnalysis?: {
        notesProvided: boolean
        notesLength: number
        aiReasoning: BilingualText // How notes influenced the evaluation
        keyPointsExtracted: string[] // Important points the AI noticed
    }
    // What external profiles were analyzed
    externalProfilesAnalysis?: {
        linkedinAnalyzed: boolean
        githubAnalyzed: boolean
        portfolioAnalyzed: boolean
        skillsDiscovered: number
        projectsFound: number
        aiReasoning: BilingualText // How external profiles influenced the score
    }
    // How language requirements were evaluated
    languageRequirementsAnalysis?: {
        totalLanguages: number
        meetsAllRequirements: boolean
        gaps: Array<{
            language: string
            required: string
            candidate: string
            gapLevel: number // How many levels below
        }>
        aiReasoning: BilingualText // How language gaps affected the score
    }
    // How experience requirement was evaluated
    experienceAnalysis?: {
        selfReported: number
        required: number
        meetsRequirement: boolean
        gap?: number
        aiReasoning: BilingualText // How experience affected the score
    }
    // Overall scoring breakdown
    scoringBreakdown?: {
        criteriaWeights: Array<{
            criteriaName: string
            weight: number // 1-10
            score: number // 0-100
            contribution: number // (weight * score) for weighted average
            aiReasoning: BilingualText // Why this score was given
        }>
        totalWeightedScore: number
        aiSummary: BilingualText // Overall explanation of the score
    }
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
    aiAnalysisBreakdown?: AIAnalysisBreakdown // NEW: Transparency of AI decisions
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
        location?: string
        linkedinUrl?: string
        behanceUrl?: string
        portfolioUrl?: string
        // HR-critical fields for evaluation
        screeningAnswers?: Record<string, boolean>  // Knockout questions
        languageProficiency?: Record<string, string> // Language levels
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
        questionWeight: number // Weight of this question (1-10)
        answer: string
    }>
    // Files
    cvUrl?: string
    // Additional candidate notes
    additionalNotes?: string  // Freeform candidate notes (max 500 chars)
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
        // HR screening questions (for knockout logic)
        screeningQuestions?: Array<{
            question: string
            idealAnswer: boolean  // The correct/desired answer (true = Yes, false = No)
            disqualify: boolean  // If true and answer doesn't match idealAnswer → critical red flag
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

        // *** NEW: Detailed analysis data for frontend display ***
        voiceAnalysisDetails?: DetailedVoiceAnalysis[]
        socialProfileInsights?: SocialProfileInsights
        textResponseAnalysis?: TextResponseAnalysis

        // *** NEW: AI Analysis Breakdown - Shows transparency of AI decisions ***
        aiAnalysisBreakdown?: AIAnalysisBreakdown
    }
    // *** NEW: Partial evaluation support ***
    partialEvaluation?: {
        applicantId: string
        jobId: string
        // What was successfully collected before failure
        transcripts?: Array<{
            questionId: string
            rawTranscript: string
            cleanTranscript: string
        }>
        parsedResume?: ParsedResume['profile']
        voiceAnalysisDetails?: DetailedVoiceAnalysis[]
        socialProfileInsights?: SocialProfileInsights
        textResponseAnalysis?: TextResponseAnalysis
        // What failed and needs retry
        failedStages: Array<'scoring' | 'recommendation'>
        canRetry: boolean
    }
    error?: string
    errorType?: 'quota_exceeded' | 'rate_limit' | 'api_error' | 'unknown'
    retryAfter?: number         // seconds to wait before retry
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

