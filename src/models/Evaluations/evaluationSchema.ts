import mongoose, { Document, Model, Schema } from 'mongoose'

export type RecommendationType = 'hire' | 'hold' | 'reject' | 'pending'

// Bilingual content types for evaluation
export interface IBilingualText {
    en: string
    ar: string
}

export interface IBilingualTextArray {
    en: string[]
    ar: string[]
}

export interface ICriteriaMatch {
    criteriaName: string
    matched: boolean
    score: number // 0-100
    weight: number // 1-10 importance
    reason: IBilingualText // Bilingual reason
    evidence?: IBilingualTextArray // Supporting evidence (bilingual)
}

// Voice analysis details (matches DetailedVoiceAnalysis from backend)
export interface IVoiceAnalysisDetails {
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

// Social profile insights (matches SocialProfileInsights from backend)
export interface ISocialProfileInsights {
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
    behance?: {
        projects: Array<{
            name: string
            description: string
            views?: number
        }>
        highlights: string[]
    }
    overallHighlights: string[]
}

// Text response analysis (matches TextResponseAnalysis from backend)
export interface ITextResponseAnalysis {
    totalResponses: number
    overallQuality: string // 'excellent', 'good', 'average', 'poor'
    responses: Array<{
        questionId: string
        questionText: string
        questionWeight: number
        answer: string
        wordCount: number
        quality: string // 'excellent', 'good', 'average', 'poor'
    }>
    insights: string[]
}

// AI Analysis Breakdown - Shows transparency of AI decisions
export interface IAIAnalysisBreakdown {
    screeningQuestionsAnalysis?: {
        totalQuestions: number
        knockoutQuestions: number
        failedKnockouts: Array<{
            question: string
            answer: boolean
            impact: string
        }>
        passedQuestions: string[]
        aiReasoning: IBilingualText
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
            aiReasoning: IBilingualText
        }>
        overallImpact: IBilingualText
    }
    textResponsesAnalysis?: {
        totalResponses: number
        totalWeight: number
        responses: Array<{
            questionText: string
            weight: number
            wordCount: number
            quality: string
            aiReasoning: IBilingualText
        }>
        overallImpact: IBilingualText
    }
    additionalNotesAnalysis?: {
        notesProvided: boolean
        notesLength: number
        aiReasoning: IBilingualText
        keyPointsExtracted: string[]
    }
    externalProfilesAnalysis?: {
        linkedinAnalyzed: boolean
        githubAnalyzed: boolean
        portfolioAnalyzed: boolean
        skillsDiscovered: number
        projectsFound: number
        aiReasoning: IBilingualText
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
        aiReasoning: IBilingualText
    }
    experienceAnalysis?: {
        selfReported: number
        required: number
        meetsRequirement: boolean
        gap?: number
        aiReasoning: IBilingualText
    }
    scoringBreakdown?: {
        criteriaWeights: Array<{
            criteriaName: string
            weight: number
            score: number
            contribution: number
            aiReasoning: IBilingualText
        }>
        totalWeightedScore: number
        aiSummary: IBilingualText
    }
}

export interface IEvaluation extends Document {
    _id: mongoose.Types.ObjectId
    applicantId: mongoose.Types.ObjectId
    jobId: mongoose.Types.ObjectId
    // AI Scores
    overallScore: number // 0-100
    criteriaMatches: ICriteriaMatch[]
    // Analysis (bilingual)
    strengths: IBilingualTextArray
    weaknesses: IBilingualTextArray
    redFlags: IBilingualTextArray
    summary: IBilingualText
    // Recommendation (bilingual)
    recommendation: RecommendationType
    recommendationReason: IBilingualText
    // Interview preparation (bilingual)
    suggestedQuestions: IBilingualTextArray // AI-generated follow-up questions
    // Sentiment analysis (from voice)
    sentimentScore?: number // -1 to 1
    confidenceScore?: number // 0-100
    // Detailed analysis sections (arrays of analysis data)
    voiceAnalysisDetails?: IVoiceAnalysisDetails[]
    socialProfileInsights?: ISocialProfileInsights
    textResponseAnalysis?: ITextResponseAnalysis
    // AI Analysis Breakdown - Transparency of AI decisions
    aiAnalysisBreakdown?: IAIAnalysisBreakdown
    // Processing status
    isProcessed: boolean
    processingError?: string
    processedAt?: Date
    // Manual override
    manualRecommendation?: RecommendationType
    manualNotes?: string
    reviewedBy?: mongoose.Types.ObjectId
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

// Sub-schema for bilingual text
const bilingualTextSchema = new Schema<IBilingualText>(
    {
        en: { type: String, default: '' },
        ar: { type: String, default: '' },
    },
    { _id: false }
)

// Sub-schema for bilingual text array
const bilingualTextArraySchema = new Schema<IBilingualTextArray>(
    {
        en: { type: [String], default: [] },
        ar: { type: [String], default: [] },
    },
    { _id: false }
)

const criteriaMatchSchema = new Schema<ICriteriaMatch>(
    {
        criteriaName: {
            type: String,
            required: true,
        },
        matched: {
            type: Boolean,
            required: true,
        },
        score: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
        weight: {
            type: Number,
            min: 1,
            max: 10,
            default: 5,
        },
        reason: {
            type: bilingualTextSchema,
            required: true,
        },
        evidence: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
    },
    { _id: false }
)

// Voice analysis sub-schemas
const sentimentSchema = new Schema(
    {
        score: Number,
        label: {
            type: String,
            enum: ['negative', 'neutral', 'positive'],
        },
    },
    { _id: false }
)

const confidenceSchema = new Schema(
    {
        score: Number,
        indicators: [String],
    },
    { _id: false }
)

const fluencySchema = new Schema(
    {
        score: Number,
        wordsPerMinute: Number,
        fillerWordCount: Number,
    },
    { _id: false }
)

const voiceAnalysisDetailsSchema = new Schema<IVoiceAnalysisDetails>(
    {
        questionId: String,
        questionText: String,
        questionWeight: Number,
        rawTranscript: String,
        cleanTranscript: String,
        sentiment: sentimentSchema,
        confidence: confidenceSchema,
        fluency: fluencySchema,
        keyPhrases: [String],
    },
    { _id: false }
)

// Social profile insights sub-schemas
const linkedInExperienceSchema = new Schema(
    {
        title: String,
        company: String,
        duration: String,
    },
    { _id: false }
)

const linkedInInsightsSchema = new Schema(
    {
        headline: String,
        summary: String,
        skills: [String],
        experience: [linkedInExperienceSchema],
        highlights: [String],
    },
    { _id: false }
)

const githubProjectSchema = new Schema(
    {
        name: String,
        description: String,
        stars: Number,
    },
    { _id: false }
)

const githubInsightsSchema = new Schema(
    {
        repositories: Number,
        stars: Number,
        languages: [String],
        topProjects: [githubProjectSchema],
        highlights: [String],
    },
    { _id: false }
)

const portfolioProjectSchema = new Schema(
    {
        name: String,
        description: String,
        technologies: [String],
    },
    { _id: false }
)

const portfolioInsightsSchema = new Schema(
    {
        projects: [portfolioProjectSchema],
        skills: [String],
        highlights: [String],
    },
    { _id: false }
)

const behanceProjectSchema = new Schema(
    {
        name: String,
        description: String,
        views: Number,
    },
    { _id: false }
)

const behanceInsightsSchema = new Schema(
    {
        projects: [behanceProjectSchema],
        highlights: [String],
    },
    { _id: false }
)

const socialProfileInsightsSchema = new Schema<ISocialProfileInsights>(
    {
        linkedin: linkedInInsightsSchema,
        github: githubInsightsSchema,
        portfolio: portfolioInsightsSchema,
        behance: behanceInsightsSchema,
        overallHighlights: [String],
    },
    { _id: false }
)

// Text response analysis sub-schemas
const textResponseDetailsSchema = new Schema(
    {
        questionId: String,
        questionText: String,
        questionWeight: Number,
        answer: String,
        wordCount: Number,
        quality: String,
    },
    { _id: false }
)

const textResponseAnalysisSchema = new Schema<ITextResponseAnalysis>(
    {
        totalResponses: Number,
        overallQuality: String,
        responses: [textResponseDetailsSchema],
        insights: [String],
    },
    { _id: false }
)

// AI Analysis Breakdown sub-schemas
const failedKnockoutSchema = new Schema(
    {
        question: String,
        answer: Boolean,
        impact: String,
    },
    { _id: false }
)

const screeningQuestionsAnalysisSchema = new Schema(
    {
        totalQuestions: Number,
        knockoutQuestions: Number,
        failedKnockouts: [failedKnockoutSchema],
        passedQuestions: [String],
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const voiceResponseBreakdownSchema = new Schema(
    {
        questionText: String,
        weight: Number,
        transcriptLength: Number,
        transcript: String, // The actual transcript for context
        sentiment: String,
        confidence: Number,
        // ENHANCED fields
        relevanceScore: Number, // 0-100 - How well does answer address question?
        communicationScore: Number, // 0-100 - Clarity, fluency, structure
        keyPointsMentioned: bilingualTextArraySchema, // Specific topics/skills mentioned
        strengthsInResponse: bilingualTextArraySchema, // What was done well
        areasForImprovement: bilingualTextArraySchema, // What could be better
        redFlagsInResponse: bilingualTextArraySchema, // Concerning patterns
        specificFeedback: bilingualTextSchema, // Detailed feedback for this answer
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const voiceResponsesAnalysisSchema = new Schema(
    {
        totalResponses: Number,
        totalWeight: Number,
        averageRelevanceScore: Number, // 0-100 average across all responses
        averageCommunicationScore: Number, // 0-100 average
        responses: [voiceResponseBreakdownSchema],
        overallImpact: bilingualTextSchema,
        overallStrengths: bilingualTextArraySchema, // Summary of communication strengths
        overallWeaknesses: bilingualTextArraySchema, // Summary of communication weaknesses
    },
    { _id: false }
)

const textResponseBreakdownSchema = new Schema(
    {
        questionText: String,
        weight: Number,
        wordCount: Number,
        quality: String,
        answer: String, // The actual answer for context
        // ENHANCED fields
        relevanceScore: Number, // 0-100 - How well does answer address question?
        communicationScore: Number, // 0-100 - Writing quality, structure
        keyPointsMentioned: bilingualTextArraySchema, // Specific topics/skills mentioned
        strengthsInResponse: bilingualTextArraySchema, // What was done well
        areasForImprovement: bilingualTextArraySchema, // What could be better
        redFlagsInResponse: bilingualTextArraySchema, // Concerning patterns
        specificFeedback: bilingualTextSchema, // Detailed feedback for this answer
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const textResponsesAnalysisSchema = new Schema(
    {
        totalResponses: Number,
        totalWeight: Number,
        averageRelevanceScore: Number, // 0-100 average across all responses
        averageContentQuality: String, // 'poor' | 'average' | 'good' | 'excellent'
        responses: [textResponseBreakdownSchema],
        overallImpact: bilingualTextSchema,
        overallStrengths: bilingualTextArraySchema, // Summary of writing strengths
        overallWeaknesses: bilingualTextArraySchema, // Summary of writing weaknesses
    },
    { _id: false }
)

const additionalNotesAnalysisSchema = new Schema(
    {
        notesProvided: Boolean,
        notesLength: Number,
        aiReasoning: bilingualTextSchema,
        keyPointsExtracted: [String],
    },
    { _id: false }
)

const externalProfilesAnalysisSchema = new Schema(
    {
        linkedinAnalyzed: Boolean,
        githubAnalyzed: Boolean,
        portfolioAnalyzed: Boolean,
        skillsDiscovered: Number,
        projectsFound: Number,
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const languageGapSchema = new Schema(
    {
        language: String,
        required: String,
        candidate: String,
        gapLevel: Number,
    },
    { _id: false }
)

const languageRequirementsAnalysisSchema = new Schema(
    {
        totalLanguages: Number,
        meetsAllRequirements: Boolean,
        gaps: [languageGapSchema],
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const experienceAnalysisSchema = new Schema(
    {
        selfReported: Number,
        required: Number,
        meetsRequirement: Boolean,
        gap: Number,
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const criteriaWeightBreakdownSchema = new Schema(
    {
        criteriaName: String,
        weight: Number,
        score: Number,
        contribution: Number,
        aiReasoning: bilingualTextSchema,
    },
    { _id: false }
)

const scoringBreakdownSchema = new Schema(
    {
        criteriaWeights: [criteriaWeightBreakdownSchema],
        totalWeightedScore: Number,
        aiSummary: bilingualTextSchema,
    },
    { _id: false }
)

const aiAnalysisBreakdownSchema = new Schema<IAIAnalysisBreakdown>(
    {
        screeningQuestionsAnalysis: screeningQuestionsAnalysisSchema,
        voiceResponsesAnalysis: voiceResponsesAnalysisSchema,
        textResponsesAnalysis: textResponsesAnalysisSchema,
        additionalNotesAnalysis: additionalNotesAnalysisSchema,
        externalProfilesAnalysis: externalProfilesAnalysisSchema,
        languageRequirementsAnalysis: languageRequirementsAnalysisSchema,
        experienceAnalysis: experienceAnalysisSchema,
        scoringBreakdown: scoringBreakdownSchema,
    },
    { _id: false }
)

const evaluationSchema = new Schema<IEvaluation>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: 'Applicant',
            required: [true, 'Applicant ID is required'],
            unique: true,
            index: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job ID is required'],
            index: true,
        },
        // Scores
        overallScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        criteriaMatches: {
            type: [criteriaMatchSchema],
            default: [],
        },
        // Analysis (bilingual)
        strengths: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        weaknesses: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        redFlags: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        summary: {
            type: bilingualTextSchema,
            default: () => ({ en: '', ar: '' }),
        },
        // Recommendation
        recommendation: {
            type: String,
            enum: ['hire', 'hold', 'reject', 'pending'],
            default: 'pending',
        },
        recommendationReason: {
            type: bilingualTextSchema,
            default: () => ({ en: '', ar: '' }),
        },
        // Interview prep (bilingual)
        suggestedQuestions: {
            type: bilingualTextArraySchema,
            default: () => ({ en: [], ar: [] }),
        },
        // Sentiment
        sentimentScore: {
            type: Number,
            min: -1,
            max: 1,
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        // Detailed analysis sections
        voiceAnalysisDetails: {
            type: [voiceAnalysisDetailsSchema],
        },
        socialProfileInsights: {
            type: socialProfileInsightsSchema,
        },
        textResponseAnalysis: {
            type: textResponseAnalysisSchema,
        },
        // AI Analysis Breakdown
        aiAnalysisBreakdown: {
            type: aiAnalysisBreakdownSchema,
        },
        // Processing
        isProcessed: {
            type: Boolean,
            default: false,
        },
        processingError: {
            type: String,
        },
        processedAt: {
            type: Date,
        },
        // Manual override
        manualRecommendation: {
            type: String,
            enum: ['hire', 'hold', 'reject', 'pending'],
        },
        manualNotes: {
            type: String,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Indexes for queries - optimized for common access patterns
evaluationSchema.index({ jobId: 1, overallScore: -1 })
evaluationSchema.index({ jobId: 1, recommendation: 1 })
evaluationSchema.index({ jobId: 1, recommendation: 1, overallScore: -1 }) // For filtered + sorted queries
evaluationSchema.index({ isProcessed: 1, createdAt: -1 }) // For finding pending evaluations
evaluationSchema.index({ processedAt: -1 }) // For date range queries

// Use existing model if available (for Next.js hot reload)
const Evaluation: Model<IEvaluation> =
    mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', evaluationSchema)

export default Evaluation

