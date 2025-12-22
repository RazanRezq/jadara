/**
 * SmartRecruit AI - Evaluation Services
 * Export all evaluation services from a single entry point
 */

// Types
export * from './types'

// Voice Transcription Service (now powered by Google Gemini 1.5 Flash)
export {
    transcribeAudio,
    transcribeAndAnalyzeAudio,
    analyzeVoiceResponse,
    batchTranscribeAudio,
    batchTranscribeAndAnalyzeAudio,
} from './voiceTranscription'
export type { TranscriptionWithAnalysis } from './voiceTranscription'

// Resume Parser Service
export {
    parseResume,
    parseLinkedInProfile,
    parsePortfolioProfile,
    mergeProfiles,
} from './resumeParser'

// Scoring Engine
export {
    scoreCandidate,
    generateRecommendation,
    checkBudget,
    calculateTotalExperience,
    matchSkills,
} from './scoringEngine'

// URL Content Extractor
export {
    extractUrlsContent,
    formatExtractedContentForEvaluation,
    detectGitHubUrl,
} from './urlContentExtractor'

// Main Evaluator
export {
    evaluateCandidate,
    batchEvaluateCandidates,
    quickScore,
} from './candidateEvaluator'

