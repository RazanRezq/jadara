/**
 * SmartRecruit AI - Evaluation Services
 * Export all evaluation services from a single entry point
 */

// Types
export * from './types'

// Voice Transcription Service
export {
    transcribeAudio,
    analyzeVoiceResponse,
    batchTranscribeAudio,
} from './voiceTranscription'

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

// Main Evaluator
export {
    evaluateCandidate,
    batchEvaluateCandidates,
    quickScore,
} from './candidateEvaluator'

