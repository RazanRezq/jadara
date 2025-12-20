/**
 * SmartRecruit AI - Candidate Evaluator Orchestrator
 * Main service that orchestrates the complete evaluation pipeline
 */

import { 
    CandidateEvaluationInput, 
    CandidateEvaluationResult,
    EvaluationProgress,
    BatchEvaluationInput,
    BatchEvaluationResult,
    VoiceAnalysisResult,
} from './types'
import { transcribeAudio, analyzeVoiceResponse, batchTranscribeAudio } from './voiceTranscription'
import { parseResume, parsePortfolioProfile, mergeProfiles } from './resumeParser'
import { scoreCandidate, generateRecommendation } from './scoringEngine'

// Progress callback type
type ProgressCallback = (progress: EvaluationProgress) => void

/**
 * Main evaluation function - processes a candidate completely
 */
export async function evaluateCandidate(
    input: CandidateEvaluationInput,
    onProgress?: ProgressCallback
): Promise<CandidateEvaluationResult> {
    const startTime = Date.now()

    try {
        console.log('[Evaluator] Starting evaluation for applicant:', input.applicantId)
        console.log('[Evaluator] Job:', input.jobCriteria.title)

        // Stage 1: Transcribe voice responses
        onProgress?.({
            stage: 'transcribing',
            progress: 10,
            currentStep: 'Transcribing voice responses...',
        })

        const transcripts: Array<{
            questionId: string
            rawTranscript: string
            cleanTranscript: string
            analysis?: VoiceAnalysisResult
        }> = []

        const voiceAnalysisResults: Array<{
            questionId: string
            questionText: string
            questionWeight: number
            transcript: string
            analysis?: VoiceAnalysisResult
        }> = []

        if (input.voiceResponses.length > 0) {
            console.log('🎯 [Evaluator] ============================================')
            console.log('🎯 [Evaluator] Processing', input.voiceResponses.length, 'voice responses')
            
            // Log all audio URLs that will be processed
            input.voiceResponses.forEach((v, index) => {
                console.log(`🎯 [Evaluator] Voice Response ${index + 1}:`)
                console.log(`   - Question ID: ${v.questionId}`)
                console.log(`   - Question: ${v.questionText}`)
                console.log(`   - Audio URL: ${v.audioUrl}`)
            })

            console.log('🎯 [Evaluator] Starting batch transcription...')
            const transcriptionResults = await batchTranscribeAudio(
                input.voiceResponses.map(v => ({
                    questionId: v.questionId,
                    audioUrl: v.audioUrl,
                }))
            )
            console.log('🎯 [Evaluator] Batch transcription completed. Results:', transcriptionResults.size)

            for (const voiceResponse of input.voiceResponses) {
                const transcription = transcriptionResults.get(voiceResponse.questionId)

                console.log(`🎯 [Evaluator] Processing result for question: ${voiceResponse.questionId}`)
                console.log(`   - Transcription success: ${transcription?.success}`)
                
                if (transcription?.success) {
                    console.log(`   ✅ Transcription successful`)
                    console.log(`   - Raw transcript length: ${transcription.rawTranscript?.length || 0}`)
                    console.log(`   - Clean transcript length: ${transcription.cleanTranscript?.length || 0}`)
                    
                    transcripts.push({
                        questionId: voiceResponse.questionId,
                        rawTranscript: transcription.rawTranscript || '',
                        cleanTranscript: transcription.cleanTranscript || '',
                    })

                    console.log(`   - Running voice analysis...`)
                    const analysis = await analyzeVoiceResponse(
                        transcription.rawTranscript || '',
                        transcription.cleanTranscript || '',
                        voiceResponse.questionText,
                        transcription.duration
                    )

                    if (analysis.success) {
                        console.log(`   ✅ Voice analysis successful`)
                    } else {
                        console.log(`   ⚠️ Voice analysis failed: ${analysis.error}`)
                    }

                    voiceAnalysisResults.push({
                        questionId: voiceResponse.questionId,
                        questionText: voiceResponse.questionText,
                        questionWeight: voiceResponse.questionWeight,
                        transcript: transcription.cleanTranscript || '',
                        analysis: analysis.success ? analysis : undefined,
                    })
                } else {
                    console.error(`   ❌ Transcription FAILED for question: ${voiceResponse.questionId}`)
                    console.error(`   - Error: ${transcription?.error || 'Unknown error'}`)
                    console.error(`   - Audio URL was: ${voiceResponse.audioUrl}`)
                    
                    transcripts.push({
                        questionId: voiceResponse.questionId,
                        rawTranscript: '',
                        cleanTranscript: '',
                    })
                }
            }
            
            console.log('🎯 [Evaluator] Voice processing summary:')
            console.log(`   - Total voice responses: ${input.voiceResponses.length}`)
            console.log(`   - Successful transcriptions: ${transcripts.filter(t => t.rawTranscript).length}`)
            console.log(`   - Failed transcriptions: ${transcripts.filter(t => !t.rawTranscript).length}`)
            console.log('🎯 [Evaluator] ============================================')
        } else {
            console.log('ℹ️ [Evaluator] No voice responses to process')
        }

        onProgress?.({
            stage: 'transcribing',
            progress: 30,
            currentStep: `Transcribed ${transcripts.length} voice responses`,
        })

        // Stage 2: Parse resume
        onProgress?.({
            stage: 'parsing_resume',
            progress: 40,
            currentStep: 'Parsing resume and profiles...',
        })

        let parsedResume = undefined

        if (input.cvUrl) {
            const resumeResult = await parseResume(input.cvUrl)

            if (resumeResult.success && resumeResult.profile) {
                let portfolioProfile = undefined

                if (input.personalData.portfolioUrl || input.personalData.behanceUrl) {
                    const portfolioUrl = input.personalData.portfolioUrl || input.personalData.behanceUrl
                    if (portfolioUrl) {
                        const portfolioResult = await parsePortfolioProfile(portfolioUrl)
                        if (portfolioResult.success) {
                            portfolioProfile = portfolioResult.profile
                        }
                    }
                }

                parsedResume = await mergeProfiles(resumeResult.profile, undefined, portfolioProfile)
            }
        }

        onProgress?.({
            stage: 'parsing_resume',
            progress: 55,
            currentStep: parsedResume ? 'Resume parsed successfully' : 'Resume parsing complete',
        })

        // Stage 3: Score the candidate
        onProgress?.({
            stage: 'scoring',
            progress: 60,
            currentStep: 'Evaluating against job criteria...',
        })

        const scoringResult = await scoreCandidate(
            {
                personalData: input.personalData,
                parsedResume,
                voiceAnalysis: voiceAnalysisResults,
                textResponses: input.textResponses,
            },
            input.jobCriteria
        )

        if (!scoringResult.success) {
            throw new Error(scoringResult.error || 'Scoring failed')
        }

        onProgress?.({
            stage: 'scoring',
            progress: 80,
            currentStep: `Scored ${scoringResult.overallScore}%`,
        })

        // Stage 4: Generate recommendation
        onProgress?.({
            stage: 'generating_recommendation',
            progress: 85,
            currentStep: 'Generating recommendation...',
        })

        const recommendationResult = await generateRecommendation(
            scoringResult,
            input.jobCriteria,
            input.personalData.name
        )

        if (!recommendationResult.success) {
            throw new Error(recommendationResult.error || 'Recommendation generation failed')
        }

        // Calculate average sentiment and confidence
        let avgSentiment: number | undefined
        let avgConfidence: number | undefined

        if (voiceAnalysisResults.length > 0) {
            const sentiments = voiceAnalysisResults
                .filter(v => v.analysis?.sentiment?.score !== undefined)
                .map(v => v.analysis!.sentiment!.score)

            const confidences = voiceAnalysisResults
                .filter(v => v.analysis?.confidence?.score !== undefined)
                .map(v => v.analysis!.confidence!.score)

            if (sentiments.length > 0) {
                avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length
            }

            if (confidences.length > 0) {
                avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
            }
        }

        onProgress?.({
            stage: 'complete',
            progress: 100,
            currentStep: 'Evaluation complete!',
        })

        const processingTime = Date.now() - startTime

        return {
            success: true,
            evaluation: {
                applicantId: input.applicantId,
                jobId: input.jobId,
                overallScore: scoringResult.overallScore,
                criteriaMatches: scoringResult.criteriaMatches,
                strengths: scoringResult.strengths,
                weaknesses: scoringResult.weaknesses,
                redFlags: scoringResult.redFlags,
                summary: scoringResult.summary,
                recommendation: recommendationResult.recommendation,
                recommendationReason: recommendationResult.reason,
                suggestedQuestions: recommendationResult.suggestedQuestions,
                sentimentScore: avgSentiment,
                confidenceScore: avgConfidence,
                transcripts,
                parsedResume,
            },
            processingTime,
        }
    } catch (error) {
        onProgress?.({
            stage: 'failed',
            progress: 0,
            currentStep: 'Evaluation failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        })

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown evaluation error',
            processingTime: Date.now() - startTime,
        }
    }
}

/**
 * Batch evaluate multiple candidates
 */
export async function batchEvaluateCandidates(
    input: BatchEvaluationInput,
    getCandidateData: (applicantId: string, jobId: string) => Promise<CandidateEvaluationInput | null>,
    onProgress?: (applicantId: string, progress: EvaluationProgress) => void
): Promise<BatchEvaluationResult> {
    const results: BatchEvaluationResult['results'] = []
    let totalFailed = 0

    for (const applicantId of input.applicantIds) {
        try {
            const candidateInput = await getCandidateData(applicantId, input.jobId)

            if (!candidateInput) {
                results.push({ applicantId, success: false, error: 'Candidate data not found' })
                totalFailed++
                continue
            }

            const result = await evaluateCandidate(
                candidateInput,
                (progress) => onProgress?.(applicantId, progress)
            )

            results.push({ applicantId, success: result.success, error: result.error })
            if (!result.success) totalFailed++

            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
            results.push({
                applicantId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
            totalFailed++
        }
    }

    return { success: totalFailed === 0, results, totalProcessed: results.length, totalFailed }
}

/**
 * Quick score for filtering
 */
export async function quickScore(input: {
    yearsOfExperience?: number
    requiredExperience: number
    skills: string[]
    requiredSkills: string[]
    preferredSkills: string[]
}): Promise<number> {
    let score = 0
    let maxScore = 0

    maxScore += 30
    if (input.yearsOfExperience !== undefined) {
        if (input.yearsOfExperience >= input.requiredExperience) score += 30
        else if (input.yearsOfExperience >= input.requiredExperience * 0.5) score += 15
    }

    if (input.requiredSkills.length > 0) {
        maxScore += 50
        const skillsLower = new Set(input.skills.map(s => s.toLowerCase()))
        const matchedRequired = input.requiredSkills.filter(s => 
            skillsLower.has(s.toLowerCase()) ||
            Array.from(skillsLower).some(cs => cs.includes(s.toLowerCase()))
        )
        score += (matchedRequired.length / input.requiredSkills.length) * 50
    }

    if (input.preferredSkills.length > 0) {
        maxScore += 20
        const skillsLower = new Set(input.skills.map(s => s.toLowerCase()))
        const matchedPreferred = input.preferredSkills.filter(s => 
            skillsLower.has(s.toLowerCase()) ||
            Array.from(skillsLower).some(cs => cs.includes(s.toLowerCase()))
        )
        score += (matchedPreferred.length / input.preferredSkills.length) * 20
    }

    return Math.round((score / maxScore) * 100)
}

export default { evaluateCandidate, batchEvaluateCandidates, quickScore }

