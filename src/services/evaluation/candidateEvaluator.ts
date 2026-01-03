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
    UrlExtractionResult,
} from './types'
import { batchTranscribeAndAnalyzeAudio, TranscriptionWithAnalysis } from './voiceTranscription'
import { parseResume, parsePortfolioProfile, mergeProfiles } from './resumeParser'
import { scoreCandidate, generateRecommendation } from './scoringEngine'
import { extractUrlsContent, formatExtractedContentForEvaluation, detectGitHubUrl } from './urlContentExtractor'

// Progress callback type
type ProgressCallback = (progress: EvaluationProgress) => void

// Rate limiting configuration - delay between major Gemini API calls
const STAGE_DELAY_MS = 7500 // 7.5 seconds between major stages to respect API rate limits and avoid quota exhaustion

/**
 * Delay helper to respect API rate limits
 */
async function rateLimitDelay(stageName: string): Promise<void> {
    console.log(`[Rate Limiter] Waiting ${STAGE_DELAY_MS}ms before ${stageName}...`)
    await new Promise(resolve => setTimeout(resolve, STAGE_DELAY_MS))
}

/**
 * Detect error type from error message
 */
function detectErrorType(error: unknown): {
    type: 'quota_exceeded' | 'rate_limit' | 'api_error' | 'unknown'
    retryAfter?: number
} {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check for quota exceeded (429 with quota message)
    if (errorMessage.includes('429') && (
        errorMessage.includes('quota') ||
        errorMessage.includes('Quota exceeded') ||
        errorMessage.includes('quota_free_tier_requests')
    )) {
        // Try to extract retry delay from error message
        const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)[s\]]/)
        const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60

        console.log(`🚨 [Error Detection] Quota exceeded. Retry after: ${retryAfter}s`)
        return { type: 'quota_exceeded', retryAfter }
    }

    // Check for rate limit (429 without quota)
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.log(`⚠️ [Error Detection] Rate limited`)
        return { type: 'rate_limit', retryAfter: 30 }
    }

    // Check for general API errors
    if (errorMessage.includes('GoogleGenerativeAI Error') ||
        errorMessage.includes('API') ||
        errorMessage.includes('fetch')) {
        console.log(`⚠️ [Error Detection] API error`)
        return { type: 'api_error' }
    }

    console.log(`❓ [Error Detection] Unknown error type`)
    return { type: 'unknown' }
}

/**
 * Check if candidate's language level meets the required level
 */
function meetsLanguageRequirement(candidateLevel: string, requiredLevel: string): boolean {
    const levels = ['beginner', 'intermediate', 'advanced', 'native']
    const candIdx = levels.indexOf(candidateLevel.toLowerCase())
    const reqIdx = levels.indexOf(requiredLevel.toLowerCase())
    
    if (candIdx === -1 || reqIdx === -1) return false
    return candIdx >= reqIdx
}

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

        // Track failed transcriptions to add as red flags
        const failedTranscriptions: Array<{
            questionId: string
            questionText: string
            error: string
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

            console.log('🎯 [Evaluator] Starting batch transcription + analysis with Gemini 1.5 Flash...')
            
            // Use the new combined transcription + analysis approach
            const transcriptionResults = await batchTranscribeAndAnalyzeAudio(
                input.voiceResponses.map(v => ({
                    questionId: v.questionId,
                    audioUrl: v.audioUrl,
                    questionText: v.questionText,
                }))
            )
            console.log('🎯 [Evaluator] Batch transcription + analysis completed. Results:', transcriptionResults.size)

            for (const voiceResponse of input.voiceResponses) {
                const result = transcriptionResults.get(voiceResponse.questionId) as TranscriptionWithAnalysis | undefined

                console.log(`🎯 [Evaluator] Processing result for question: ${voiceResponse.questionId}`)
                console.log(`   - Success: ${result?.success}`)
                
                if (result?.success) {
                    console.log(`   ✅ Transcription + Analysis successful`)
                    console.log(`   - Raw transcript length: ${result.rawTranscript?.length || 0}`)
                    console.log(`   - Clean transcript length: ${result.cleanTranscript?.length || 0}`)
                    console.log(`   - Analysis included: ${result.analysis?.success ? 'YES' : 'NO'}`)
                    
                    transcripts.push({
                        questionId: voiceResponse.questionId,
                        rawTranscript: result.rawTranscript || '',
                        cleanTranscript: result.cleanTranscript || '',
                    })

                    // Analysis is already computed from Gemini in one go
                    voiceAnalysisResults.push({
                        questionId: voiceResponse.questionId,
                        questionText: voiceResponse.questionText,
                        questionWeight: voiceResponse.questionWeight,
                        transcript: result.cleanTranscript || '',
                        analysis: result.analysis?.success ? result.analysis : undefined,
                    })
                } else {
                    console.error(`   ❌ Transcription FAILED for question: ${voiceResponse.questionId}`)
                    console.error(`   - Error: ${result?.error || 'Unknown error'}`)
                    console.error(`   - Audio URL was: ${voiceResponse.audioUrl}`)

                    // Track failed transcription for red flags
                    failedTranscriptions.push({
                        questionId: voiceResponse.questionId,
                        questionText: voiceResponse.questionText,
                        error: result?.error || 'Audio transcription failed',
                    })

                    // Still push empty transcript but mark as failed
                    transcripts.push({
                        questionId: voiceResponse.questionId,
                        rawTranscript: '[TRANSCRIPTION_FAILED]',
                        cleanTranscript: '[TRANSCRIPTION_FAILED]',
                    })

                    // Add to voice analysis with failed marker
                    voiceAnalysisResults.push({
                        questionId: voiceResponse.questionId,
                        questionText: voiceResponse.questionText,
                        questionWeight: voiceResponse.questionWeight,
                        transcript: '[TRANSCRIPTION_FAILED]',
                        analysis: undefined,
                    })
                }
            }
            
            console.log('🎯 [Evaluator] Voice processing summary:')
            console.log(`   - Total voice responses: ${input.voiceResponses.length}`)
            console.log(`   - Successful transcriptions: ${transcripts.filter(t => t.rawTranscript && t.rawTranscript !== '[TRANSCRIPTION_FAILED]').length}`)
            console.log(`   - Failed transcriptions: ${failedTranscriptions.length}`)
            console.log('🎯 [Evaluator] ============================================')
        } else {
            console.log('ℹ️ [Evaluator] No voice responses to process')
        }

        onProgress?.({
            stage: 'transcribing',
            progress: 30,
            currentStep: `Transcribed ${transcripts.length} voice responses`,
        })

        // Rate limit delay before resume parsing
        if (input.voiceResponses.length > 0) {
            await rateLimitDelay('resume parsing')
        }

        // Stage 2: Parse resume
        onProgress?.({
            stage: 'parsing_resume',
            progress: 35,
            currentStep: 'Parsing resume and profiles...',
        })

        let parsedResume = undefined
        let resumeParsingFailed = false

        if (input.cvUrl) {
            console.log('[Evaluator] 📄 Parsing resume from:', input.cvUrl)
            try {
                const resumeResult = await parseResume(input.cvUrl)

                if (resumeResult.success && resumeResult.profile) {
                    console.log('[Evaluator] ✅ Resume parsed successfully')
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
                } else {
                    console.error('[Evaluator] ❌ Resume parsing failed:', resumeResult.error)
                    resumeParsingFailed = true
                }
            } catch (resumeError) {
                console.error('[Evaluator] ❌ Resume parsing error:', resumeError)
                resumeParsingFailed = true
            }
        } else {
            console.log('[Evaluator] ℹ️ No CV URL provided')
        }

        // Note: Resume parsing failure will be added to red flags after preEvaluationRedFlags is declared

        onProgress?.({
            stage: 'parsing_resume',
            progress: 45,
            currentStep: parsedResume ? 'Resume parsed successfully' : 'Resume parsing complete',
        })

        // Rate limit delay before URL extraction
        if (input.cvUrl) {
            await rateLimitDelay('URL extraction')
        }

        // Stage 2.5: Extract content from external URLs (LinkedIn, GitHub, Portfolio, Behance)
        onProgress?.({
            stage: 'parsing_resume',
            progress: 48,
            currentStep: 'Extracting content from online profiles...',
        })

        let urlExtractionResult: UrlExtractionResult | undefined = undefined

        // Check for URLs to extract
        const hasExternalUrls = input.personalData.linkedinUrl || 
            input.personalData.portfolioUrl || 
            input.personalData.behanceUrl

        if (hasExternalUrls) {
            console.log('[Evaluator] 🔗 Starting URL content extraction...')
            console.log('[Evaluator] URLs to process:')
            console.log(`   - LinkedIn: ${input.personalData.linkedinUrl || 'N/A'}`)
            console.log(`   - Portfolio: ${input.personalData.portfolioUrl || 'N/A'}`)
            console.log(`   - Behance: ${input.personalData.behanceUrl || 'N/A'}`)

            // Detect GitHub URL from portfolio if provided
            const githubUrl = detectGitHubUrl({
                portfolioUrl: input.personalData.portfolioUrl,
                linkedinUrl: input.personalData.linkedinUrl,
            })

            urlExtractionResult = await extractUrlsContent({
                linkedinUrl: input.personalData.linkedinUrl,
                githubUrl,
                portfolioUrl: !githubUrl ? input.personalData.portfolioUrl : undefined, // Don't double-process if it's GitHub
                behanceUrl: input.personalData.behanceUrl,
            })

            console.log('[Evaluator] 🔗 URL extraction complete:')
            console.log(`   - Success: ${urlExtractionResult.success}`)
            console.log(`   - URLs processed: ${urlExtractionResult.extractedUrls.length}`)
            console.log(`   - Skills discovered: ${urlExtractionResult.allSkills.length}`)
            console.log(`   - Projects found: ${urlExtractionResult.totalProjectsFound}`)

            if (urlExtractionResult.errors.length > 0) {
                console.log(`   - Errors: ${urlExtractionResult.errors.join(', ')}`)
            }
        } else {
            console.log('[Evaluator] ℹ️ No external URLs provided for extraction')
        }

        onProgress?.({
            stage: 'parsing_resume',
            progress: 55,
            currentStep: urlExtractionResult?.success 
                ? `Extracted content from ${urlExtractionResult.extractedUrls.length} online profile(s)`
                : 'Profile extraction complete',
        })

        // Rate limit delay before scoring
        await rateLimitDelay('candidate scoring')

        // Stage 3: Score the candidate
        onProgress?.({
            stage: 'scoring',
            progress: 60,
            currentStep: 'Evaluating against job criteria...',
        })

        // Format URL content for AI evaluation if available
        const urlContentForEvaluation = urlExtractionResult
            ? formatExtractedContentForEvaluation(urlExtractionResult)
            : undefined

        // Build detailed voice analysis for frontend (before scoring, so it's available for partial results)
        const voiceAnalysisDetails: import('./types').DetailedVoiceAnalysis[] = voiceAnalysisResults.map(v => ({
            questionId: v.questionId,
            questionText: v.questionText,
            questionWeight: v.questionWeight,
            rawTranscript: transcripts.find(t => t.questionId === v.questionId)?.rawTranscript || '',
            cleanTranscript: transcripts.find(t => t.questionId === v.questionId)?.cleanTranscript || '',
            sentiment: v.analysis?.sentiment,
            confidence: v.analysis?.confidence,
            fluency: v.analysis?.fluency,
            keyPhrases: v.analysis?.keyPhrases,
        }))

        // Build social profile insights from URL extraction (before scoring)
        let socialProfileInsights: import('./types').SocialProfileInsights | undefined = undefined

        if (urlExtractionResult?.success && urlExtractionResult.extractedUrls) {
            const linkedinData = urlExtractionResult.extractedUrls.find(u => u.type === 'linkedin')
            const githubData = urlExtractionResult.extractedUrls.find(u => u.type === 'github')
            const portfolioData = urlExtractionResult.extractedUrls.find(u => u.type === 'portfolio')

            socialProfileInsights = {
                linkedin: linkedinData?.success && linkedinData.content ? {
                    headline: linkedinData.content.summary?.split('\n')[0] || '',
                    summary: linkedinData.content.summary || '',
                    skills: linkedinData.content.skills || [],
                    experience: linkedinData.content.experience?.map(exp => {
                        // exp is a string like "Position at Company"
                        // Parse it to extract title and company
                        const parts = exp.split(' at ')
                        return {
                            title: parts[0] || exp,
                            company: parts[1] || '',
                            duration: ''
                        }
                    }) || [],
                    highlights: linkedinData.content.highlights || [],
                } : undefined,
                github: githubData?.success && githubData.content ? {
                    repositories: githubData.content.projects?.length || 0,
                    stars: githubData.content.projects?.reduce((sum, p) => sum + (p.stars || 0), 0) || 0,
                    languages: Array.from(new Set(githubData.content.projects?.flatMap(p => p.technologies) || [])),
                    topProjects: githubData.content.projects?.slice(0, 5).map(p => ({
                        name: p.name,
                        description: p.description,
                        stars: p.stars || 0
                    })) || [],
                    highlights: githubData.content.highlights || [],
                } : undefined,
                portfolio: portfolioData?.success && portfolioData.content ? {
                    projects: portfolioData.content.projects || [],
                    skills: portfolioData.content.skills || [],
                    highlights: portfolioData.content.highlights || [],
                } : undefined,
                overallHighlights: [
                    ...(linkedinData?.content?.highlights || []),
                    ...(githubData?.content?.highlights || []),
                    ...(portfolioData?.content?.highlights || []),
                ].slice(0, 10),
            }
        }

        // Build text response analysis (before scoring)
        let textResponseAnalysis: import('./types').TextResponseAnalysis | undefined = undefined

        if (input.textResponses && input.textResponses.length > 0) {
            const responses = input.textResponses.map(r => {
                const wordCount = r.answer.split(/\s+/).length
                let quality: 'poor' | 'average' | 'good' | 'excellent' = 'average'

                if (wordCount < 20) quality = 'poor'
                else if (wordCount < 50) quality = 'average'
                else if (wordCount < 100) quality = 'good'
                else quality = 'excellent'

                return {
                    questionId: r.questionId,
                    questionText: r.questionText,
                    questionWeight: r.questionWeight, // Include weight
                    answer: r.answer,
                    wordCount,
                    quality,
                }
            })

            const qualityScores = responses.map(r => {
                const scores = { poor: 1, average: 2, good: 3, excellent: 4 }
                return scores[r.quality]
            })
            const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length

            let overallQuality: 'poor' | 'average' | 'good' | 'excellent' = 'average'
            if (avgQuality < 1.5) overallQuality = 'poor'
            else if (avgQuality < 2.5) overallQuality = 'average'
            else if (avgQuality < 3.5) overallQuality = 'good'
            else overallQuality = 'excellent'

            textResponseAnalysis = {
                totalResponses: responses.length,
                responses,
                overallQuality,
                insights: [
                    `${responses.length} written responses provided`,
                    `Average word count: ${Math.round(responses.reduce((a, b) => a + b.wordCount, 0) / responses.length)}`,
                    `Overall quality: ${overallQuality}`,
                ],
            }
        }

        // Pre-evaluation checks for critical HR requirements
        const preEvaluationRedFlags: { en: string[], ar: string[] } = { en: [], ar: [] }

        // Check for failed voice transcriptions (critical red flag)
        if (failedTranscriptions.length > 0) {
            for (const failed of failedTranscriptions) {
                preEvaluationRedFlags.en.push(`Voice response failed to process: "${failed.questionText}" - ${failed.error}`)
                preEvaluationRedFlags.ar.push(`فشل معالجة الرد الصوتي: "${failed.questionText}" - ${failed.error}`)
            }
            console.log(`⚠️ [Evaluator] Added ${failedTranscriptions.length} failed transcription red flags`)
        }

        // Add red flag if resume parsing failed (declared earlier, now we can add to red flags)
        if (resumeParsingFailed) {
            preEvaluationRedFlags.en.push('Resume/CV could not be parsed - manual review recommended')
            preEvaluationRedFlags.ar.push('لم يتم تحليل السيرة الذاتية - يُنصح بالمراجعة اليدوية')
            console.log('⚠️ [Evaluator] Added resume parsing failure red flag')
        }

        // Check knockout questions
        if (input.personalData.screeningAnswers && input.jobCriteria.screeningQuestions) {
            for (const sq of input.jobCriteria.screeningQuestions) {
                if (sq.disqualify && input.personalData.screeningAnswers[sq.question] === false) {
                    preEvaluationRedFlags.en.push(`Failed knockout question: ${sq.question}`)
                    preEvaluationRedFlags.ar.push(`فشل في سؤال الإقصاء: ${sq.question}`)
                }
            }
        }

        // Check language requirements
        if (input.personalData.languageProficiency && input.jobCriteria.languages) {
            for (const reqLang of input.jobCriteria.languages) {
                const candidateLevel = input.personalData.languageProficiency[reqLang.language]
                if (!candidateLevel) {
                    preEvaluationRedFlags.en.push(`Missing required language: ${reqLang.language} (${reqLang.level} required)`)
                    preEvaluationRedFlags.ar.push(`لغة مطلوبة مفقودة: ${reqLang.language} (المطلوب: ${reqLang.level})`)
                } else if (!meetsLanguageRequirement(candidateLevel, reqLang.level)) {
                    preEvaluationRedFlags.en.push(`Language gap: ${reqLang.language} - Has ${candidateLevel}, requires ${reqLang.level}`)
                    preEvaluationRedFlags.ar.push(`فجوة لغوية: ${reqLang.language} - لديه ${candidateLevel}، المطلوب ${reqLang.level}`)
                }
            }
        }

        // Check experience requirement
        if (input.jobCriteria.minExperience && input.personalData.yearsOfExperience !== undefined) {
            if (input.personalData.yearsOfExperience < input.jobCriteria.minExperience) {
                const gap = input.jobCriteria.minExperience - input.personalData.yearsOfExperience
                preEvaluationRedFlags.en.push(`Experience gap: ${gap} year${gap > 1 ? 's' : ''} below minimum (Has ${input.personalData.yearsOfExperience}, requires ${input.jobCriteria.minExperience})`)
                preEvaluationRedFlags.ar.push(`فجوة خبرة: ${gap} سنة أقل من الحد الأدنى (لديه ${input.personalData.yearsOfExperience}، المطلوب ${input.jobCriteria.minExperience})`)
            }
        }

        // Try scoring with graceful degradation on failure
        let scoringResult: Awaited<ReturnType<typeof scoreCandidate>> | null = null
        let scoringError: { type: string; retryAfter?: number; message: string } | null = null

        try {
            scoringResult = await scoreCandidate(
                {
                    personalData: input.personalData,
                    parsedResume,
                    voiceAnalysis: voiceAnalysisResults,
                    textResponses: input.textResponses,
                    urlContent: urlContentForEvaluation,
                    additionalNotes: input.additionalNotes,
                },
                input.jobCriteria
            )

            if (!scoringResult.success) {
                throw new Error(scoringResult.error || 'Scoring failed')
            }

            // Merge pre-evaluation red flags with AI-generated ones
            if (preEvaluationRedFlags.en.length > 0 || preEvaluationRedFlags.ar.length > 0) {
                scoringResult.redFlags.en = [...preEvaluationRedFlags.en, ...(scoringResult.redFlags.en || [])]
                scoringResult.redFlags.ar = [...preEvaluationRedFlags.ar, ...(scoringResult.redFlags.ar || [])]
            }

            onProgress?.({
                stage: 'scoring',
                progress: 80,
                currentStep: `Scored ${scoringResult.overallScore}%`,
            })
        } catch (error) {
            console.error('🚨 [Evaluator] Scoring failed, entering graceful degradation mode')
            console.error('🚨 [Evaluator] Error:', error)

            const errorInfo = detectErrorType(error)
            scoringError = {
                type: errorInfo.type,
                retryAfter: errorInfo.retryAfter,
                message: error instanceof Error ? error.message : 'Unknown scoring error',
            }

            // If scoring failed, return partial evaluation with collected data
            console.log('📦 [Evaluator] Saving partial evaluation with collected data...')
            console.log('📦 [Evaluator] - Transcripts:', transcripts.length)
            console.log('📦 [Evaluator] - Voice analysis:', voiceAnalysisDetails.length)
            console.log('📦 [Evaluator] - Resume parsed:', !!parsedResume)
            console.log('📦 [Evaluator] - Social insights:', !!socialProfileInsights)

            return {
                success: false,
                partialEvaluation: {
                    applicantId: input.applicantId,
                    jobId: input.jobId,
                    transcripts: transcripts.length > 0 ? transcripts : undefined,
                    parsedResume,
                    voiceAnalysisDetails: voiceAnalysisDetails.length > 0 ? voiceAnalysisDetails : undefined,
                    socialProfileInsights,
                    textResponseAnalysis,
                    failedStages: ['scoring', 'recommendation'],
                    canRetry: errorInfo.type === 'quota_exceeded' || errorInfo.type === 'rate_limit',
                },
                error: scoringError.message,
                errorType: errorInfo.type,
                retryAfter: errorInfo.retryAfter,
                processingTime: Date.now() - startTime,
            }
        }

        // Rate limit delay before recommendation generation
        await rateLimitDelay('recommendation generation')

        // Stage 4: Generate recommendation with graceful degradation
        onProgress?.({
            stage: 'generating_recommendation',
            progress: 85,
            currentStep: 'Generating recommendation...',
        })

        let recommendationResult: Awaited<ReturnType<typeof generateRecommendation>> | null = null
        let recommendationError: { type: string; retryAfter?: number; message: string } | null = null

        try {
            recommendationResult = await generateRecommendation(
                scoringResult,
                input.jobCriteria,
                input.personalData.name
            )

            if (!recommendationResult.success) {
                throw new Error(recommendationResult.error || 'Recommendation generation failed')
            }
        } catch (error) {
            console.error('⚠️ [Evaluator] Recommendation generation failed, using fallback')
            console.error('⚠️ [Evaluator] Error:', error)

            const errorInfo = detectErrorType(error)
            recommendationError = {
                type: errorInfo.type,
                retryAfter: errorInfo.retryAfter,
                message: error instanceof Error ? error.message : 'Unknown recommendation error',
            }

            // Use fallback recommendation based on score
            const score = scoringResult.overallScore
            let fallbackRecommendation: 'hire' | 'hold' | 'reject' | 'pending' = 'pending'

            if (score >= 80) fallbackRecommendation = 'hire'
            else if (score >= 60) fallbackRecommendation = 'hold'
            else if (score < input.jobCriteria.autoRejectThreshold) fallbackRecommendation = 'reject'

            recommendationResult = {
                success: true,
                recommendation: fallbackRecommendation,
                confidence: 50, // Low confidence for fallback
                reason: {
                    en: `Automated recommendation based on ${score}% match score (AI recommendation unavailable due to quota limit)`,
                    ar: `توصية تلقائية بناءً على نسبة تطابق ${score}% (التوصية بالذكاء الاصطناعي غير متوفرة بسبب حد الحصة)`,
                },
                suggestedQuestions: {
                    en: ['Review candidate manually for detailed assessment'],
                    ar: ['مراجعة المرشح يدويًا للتقييم التفصيلي'],
                },
                nextBestAction: {
                    en: 'Manual review recommended',
                    ar: 'يُنصح بالمراجعة اليدوية',
                },
            }

            console.log(`✅ [Evaluator] Using fallback recommendation: ${fallbackRecommendation} (score: ${score}%)`)
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

        // All analysis details were already built before scoring (for partial evaluation support)
        const processingTime = Date.now() - startTime

        return {
            success: true,
            evaluation: {
                applicantId: input.applicantId,
                jobId: input.jobId,
                overallScore: scoringResult.overallScore,
                criteriaMatches: scoringResult.criteriaMatches,
                // Bilingual content fields
                strengths: scoringResult.strengths,
                weaknesses: scoringResult.weaknesses,
                redFlags: scoringResult.redFlags,
                summary: scoringResult.summary,
                recommendation: recommendationResult.recommendation,
                recommendationReason: recommendationResult.reason,
                suggestedQuestions: recommendationResult.suggestedQuestions,
                // Sentiment scores
                sentimentScore: avgSentiment,
                confidenceScore: avgConfidence,
                transcripts,
                parsedResume,
                
                // *** NEW: Pass through detailed analysis ***
                voiceAnalysisDetails: voiceAnalysisDetails.length > 0 ? voiceAnalysisDetails : undefined,
                socialProfileInsights,
                textResponseAnalysis,

                // *** NEW: AI Analysis Breakdown for transparency ***
                aiAnalysisBreakdown: scoringResult.aiAnalysisBreakdown,
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
 * Batch evaluate multiple candidates sequentially
 * Processes one at a time to respect API rate limits (especially for free tier)
 */
export async function batchEvaluateCandidates(
    input: BatchEvaluationInput,
    getCandidateData: (applicantId: string, jobId: string) => Promise<CandidateEvaluationInput | null>,
    onProgress?: (applicantId: string, progress: EvaluationProgress) => void
): Promise<BatchEvaluationResult> {
    const results: BatchEvaluationResult['results'] = []
    let totalFailed = 0

    // Process one at a time to avoid rate limiting
    for (let i = 0; i < input.applicantIds.length; i++) {
        const applicantId = input.applicantIds[i]
        console.log(`[Batch] Processing applicant ${i + 1}/${input.applicantIds.length}: ${applicantId}`)

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

            // Check if we hit rate limit and need to wait
            if (result.error?.includes('429') || result.error?.includes('quota')) {
                console.log('[Batch] Rate limit detected, waiting 60 seconds before next applicant...')
                await new Promise(resolve => setTimeout(resolve, 60000))
            } else if (i < input.applicantIds.length - 1) {
                // Normal delay between applicants (10 seconds to be safe with rate limits)
                console.log('[Batch] Waiting 10 seconds before next applicant...')
                await new Promise(resolve => setTimeout(resolve, 10000))
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.push({ applicantId, success: false, error: errorMessage })
            totalFailed++

            // If rate limited, wait before continuing
            if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                console.log('[Batch] Rate limit detected, waiting 60 seconds...')
                await new Promise(resolve => setTimeout(resolve, 60000))
            }
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

