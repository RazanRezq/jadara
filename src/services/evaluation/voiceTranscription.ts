/**
 * SmartRecruit AI - Voice Transcription Service
 * Uses Google Gemini 1.5 Flash for Speech-to-Text with Arabic/English support
 * Provides transcription AND analysis in a single API call
 */

import axios from 'axios'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { TranscriptionResult, VoiceAnalysisResult } from './types'

// Gemini 2.5 Flash for audio processing
const GEMINI_MODEL = 'gemini-2.5-flash'

/**
 * Combined result type for transcription + analysis in one go
 */
export interface TranscriptionWithAnalysis extends TranscriptionResult {
    analysis?: VoiceAnalysisResult
}

/**
 * Download audio file using axios for better stability
 */
async function downloadAudioFile(audioUrl: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        console.log('🎤 [Audio Download] Downloading audio from:', audioUrl)
        
        const response = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60 second timeout
            headers: {
                'Accept': 'audio/*,*/*',
            },
        })

        console.log('🎤 [Audio Download] Response status:', response.status)
        console.log('🎤 [Audio Download] Content-Type:', response.headers['content-type'])
        console.log('🎤 [Audio Download] Content-Length:', response.headers['content-length'])

        const buffer = Buffer.from(response.data)
        
        if (buffer.length === 0) {
            console.error('❌ [Audio Download] Downloaded file is empty')
            return null
        }

        // Determine MIME type from content-type header or URL
        let mimeType = response.headers['content-type'] || 'audio/webm'
        
        // Clean up mime type (remove charset and other parameters)
        if (mimeType.includes(';')) {
            mimeType = mimeType.split(';')[0].trim()
        }

        // Map common audio types
        if (audioUrl.endsWith('.webm') || mimeType.includes('webm')) {
            mimeType = 'audio/webm'
        } else if (audioUrl.endsWith('.mp3') || mimeType.includes('mp3')) {
            mimeType = 'audio/mp3'
        } else if (audioUrl.endsWith('.wav') || mimeType.includes('wav')) {
            mimeType = 'audio/wav'
        } else if (audioUrl.endsWith('.m4a') || mimeType.includes('m4a')) {
            mimeType = 'audio/mp4'
        } else if (audioUrl.endsWith('.ogg') || mimeType.includes('ogg')) {
            mimeType = 'audio/ogg'
        }

        console.log('🎤 [Audio Download] Successfully downloaded', buffer.length, 'bytes')
        console.log('🎤 [Audio Download] Using MIME type:', mimeType)

        return { buffer, mimeType }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('❌ [Audio Download] Axios error:', error.message)
            console.error('❌ [Audio Download] Status:', error.response?.status)
            console.error('❌ [Audio Download] URL:', audioUrl)
        } else {
            console.error('❌ [Audio Download] Error:', error)
        }
        return null
    }
}

/**
 * Transcribe AND analyze audio using Google Gemini 1.5 Flash
 * Performs both operations in a single API call for efficiency
 */
export async function transcribeAndAnalyzeAudio(
    audioUrl: string,
    questionText: string
): Promise<TranscriptionWithAnalysis> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            console.error('❌ [Transcription] CRITICAL ERROR: GOOGLE_API_KEY not found in environment variables')
            return {
                success: false,
                error: 'Google API key not configured. Please add GOOGLE_API_KEY to your environment.',
            }
        }

        console.log('🎤 [Transcription] ============================================')
        console.log('🎤 [Transcription] Starting transcription for audio URL:', audioUrl)
        console.log('🎤 [Transcription] Question context:', questionText.substring(0, 100))

        // Step 1: Download audio file using axios
        console.log('🎤 [Transcription] Step 1: Downloading audio file with axios...')
        const audioData = await downloadAudioFile(audioUrl)
        
        if (!audioData) {
            return {
                success: false,
                error: 'Failed to download audio file from URL',
            }
        }

        console.log('🎤 [Transcription] Step 2: Preparing audio for Gemini...')
        
        // Convert to base64 for Gemini
        const base64Audio = audioData.buffer.toString('base64')
        console.log('🎤 [Transcription] Base64 audio length:', base64Audio.length)

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // Prepare the audio part for Gemini
        const audioPart: Part = {
            inlineData: {
                mimeType: audioData.mimeType,
                data: base64Audio,
            },
        }

        // Combined prompt for transcription + analysis in one go
        const prompt = `You are an expert audio transcription and analysis AI. Listen to this audio recording carefully.

**CONTEXT:**
This is a candidate's voice response to an interview question.
Question asked: "${questionText}"

**TASK:**
1. Transcribe the audio EXACTLY as spoken (including any filler words like "um", "uh", "يعني", etc.)
2. Create a cleaned version of the transcript (remove fillers, fix minor grammar issues)
3. Analyze the response for sentiment, confidence, and relevance

**IMPORTANT:**
- The audio may be in Arabic, English, or a mix of both - transcribe in the original language(s)
- Do NOT translate - keep the transcription in the original language
- Be accurate with the transcription

**RESPOND WITH ONLY THIS JSON (no other text):**
{
    "rawTranscript": "<exact transcription including filler words>",
    "cleanTranscript": "<cleaned version without fillers, corrected grammar>",
    "language": "<detected language: 'ar' for Arabic, 'en' for English, 'mixed' for both>",
    "analysis": {
        "sentiment": {
            "score": <number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
            "label": "<negative|neutral|positive>"
        },
        "confidence": {
            "score": <number from 0 to 100, how confident the speaker sounds>,
            "indicators": ["<list of confidence/hesitation indicators observed>"]
        },
        "relevance": {
            "score": <number from 0 to 100, how relevant the answer is to the question>,
            "reasoning": "<brief explanation>"
        },
        "fluency": {
            "score": <number from 0 to 100>,
            "fillerWordCount": <approximate count of filler words>,
            "observations": "<brief note on speech clarity and pace>"
        },
        "keyPhrases": ["<list of 3-5 important phrases from the response>"]
    }
}`

        console.log('🎤 [Transcription] Step 3: Calling Gemini 2.5 Flash Lite API...')
        
        const result = await model.generateContent([prompt, audioPart])
        let responseText = result.response.text().trim()
        
        console.log('🎤 [Transcription] Gemini response received, length:', responseText.length)

        // Clean JSON response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // Parse the JSON response
        const geminiResult = JSON.parse(responseText)

        console.log('✅ [Transcription] SUCCESS! Transcription and analysis completed')
        console.log('✅ [Transcription] Raw transcript length:', geminiResult.rawTranscript?.length || 0)
        console.log('✅ [Transcription] Clean transcript length:', geminiResult.cleanTranscript?.length || 0)
        console.log('✅ [Transcription] Detected language:', geminiResult.language)
        console.log('✅ [Transcription] Sentiment:', geminiResult.analysis?.sentiment?.label)
        console.log('✅ [Transcription] Confidence score:', geminiResult.analysis?.confidence?.score)
        console.log('🎤 [Transcription] ============================================')

        return {
            success: true,
            rawTranscript: geminiResult.rawTranscript || '',
            cleanTranscript: geminiResult.cleanTranscript || '',
            confidence: 0.95, // High confidence with Gemini
            language: geminiResult.language || 'en',
            analysis: {
                success: true,
                sentiment: geminiResult.analysis?.sentiment,
                confidence: geminiResult.analysis?.confidence,
                fluency: {
                    score: geminiResult.analysis?.fluency?.score || 75,
                    fillerWordCount: geminiResult.analysis?.fluency?.fillerWordCount || 0,
                },
                keyPhrases: geminiResult.analysis?.keyPhrases || [],
            },
        }
    } catch (error) {
        console.error('❌ [Transcription] EXCEPTION CAUGHT:', error)
        console.error('❌ [Transcription] Error name:', error instanceof Error ? error.name : 'Unknown')
        console.error('❌ [Transcription] Error message:', error instanceof Error ? error.message : 'Unknown')
        
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown transcription error',
        }
    }
}

/**
 * Legacy transcribeAudio function - now uses Gemini
 * Kept for backward compatibility with existing code
 */
export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
    // Use the new combined function with a generic question context
    const result = await transcribeAndAnalyzeAudio(audioUrl, 'Interview question response')
    
    // Return just the transcription part
    return {
        success: result.success,
        rawTranscript: result.rawTranscript,
        cleanTranscript: result.cleanTranscript,
        confidence: result.confidence,
        language: result.language,
        error: result.error,
    }
}

/**
 * Legacy analyzeVoiceResponse function - now extracts from combined result
 * Kept for backward compatibility but can be called directly with pre-computed analysis
 */
export async function analyzeVoiceResponse(
    rawTranscript: string,
    cleanTranscript: string,
    questionText: string,
    audioDuration?: number,
    precomputedAnalysis?: VoiceAnalysisResult
): Promise<VoiceAnalysisResult> {
    // If we have precomputed analysis from transcribeAndAnalyzeAudio, use it
    if (precomputedAnalysis && precomputedAnalysis.success) {
        return precomputedAnalysis
    }

    // Otherwise, analyze the transcript text with Gemini
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            return {
                success: false,
                error: 'GOOGLE_API_KEY not configured',
            }
        }

        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // Calculate words per minute if duration available
        const wordCount = cleanTranscript.split(/\s+/).length
        const wpm = audioDuration ? Math.round((wordCount / audioDuration) * 60) : undefined

        // Count filler words in raw transcript
        const fillerPattern = /\b(umm?|ahh?|uhh?|like|you know|يعني|آه|إيه|امممم)\b/gi
        const fillerCount = (rawTranscript.match(fillerPattern) || []).length

        const prompt = `Analyze this voice response from a job interview candidate.

**Question asked:**
${questionText}

**Candidate's response (cleaned):**
${cleanTranscript}

**Analysis required (respond in JSON format):**
{
    "sentiment": {
        "score": <number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
        "label": "<negative|neutral|positive>",
        "reasoning": "<brief explanation>"
    },
    "confidence": {
        "score": <number from 0 to 100>,
        "indicators": ["<list of confidence/hesitation indicators>"]
    },
    "relevance": {
        "score": <number from 0 to 100, how relevant the answer is to the question>,
        "reasoning": "<brief explanation>"
    },
    "keyPhrases": ["<list of 3-5 important phrases from the response>"]
}

Respond ONLY with the JSON, no additional text.`

        const result = await model.generateContent(prompt)
        let responseText = result.response.text().trim()
        
        // Clean JSON response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const analysis = JSON.parse(responseText)

        return {
            success: true,
            sentiment: {
                score: analysis.sentiment?.score || 0,
                label: analysis.sentiment?.label || 'neutral',
            },
            confidence: {
                score: analysis.confidence?.score || 50,
                indicators: analysis.confidence?.indicators || [],
            },
            fluency: {
                score: Math.max(0, 100 - (fillerCount * 5)), // Reduce score by 5 per filler
                wordsPerMinute: wpm,
                fillerWordCount: fillerCount,
            },
            keyPhrases: analysis.keyPhrases || [],
        }
    } catch (error) {
        console.error('[Voice Analysis] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown analysis error',
        }
    }
}

/**
 * Batch transcribe and analyze multiple audio files
 * Uses the combined Gemini approach for efficiency
 */
export async function batchTranscribeAndAnalyzeAudio(
    audioInputs: Array<{ questionId: string; audioUrl: string; questionText: string }>
): Promise<Map<string, TranscriptionWithAnalysis>> {
    console.log('🔄 [Batch Transcription] ============================================')
    console.log('🔄 [Batch Transcription] Starting batch transcription for', audioInputs.length, 'audio files')
    
    const results = new Map<string, TranscriptionWithAnalysis>()
    
    // Process in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 3
    const chunks = []
    
    for (let i = 0; i < audioInputs.length; i += CONCURRENCY_LIMIT) {
        chunks.push(audioInputs.slice(i, i + CONCURRENCY_LIMIT))
    }

    console.log('🔄 [Batch Transcription] Processing in', chunks.length, 'chunks with concurrency limit:', CONCURRENCY_LIMIT)

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]
        console.log(`🔄 [Batch Transcription] Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} files)`)
        
        const chunkResults = await Promise.all(
            chunk.map(async ({ questionId, audioUrl, questionText }) => {
                console.log(`🔄 [Batch Transcription] Transcribing question: ${questionId}`)
                const result = await transcribeAndAnalyzeAudio(audioUrl, questionText)
                console.log(`🔄 [Batch Transcription] Question ${questionId} result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
                if (!result.success) {
                    console.error(`🔄 [Batch Transcription] Error for ${questionId}: ${result.error}`)
                }
                return { questionId, result }
            })
        )

        for (const { questionId, result } of chunkResults) {
            results.set(questionId, result)
        }
    }

    const successCount = Array.from(results.values()).filter(r => r.success).length
    const failCount = results.size - successCount
    
    console.log('🔄 [Batch Transcription] Batch transcription completed')
    console.log(`🔄 [Batch Transcription] Total: ${results.size}, Success: ${successCount}, Failed: ${failCount}`)
    console.log('🔄 [Batch Transcription] ============================================')

    return results
}

/**
 * Legacy batch function - kept for backward compatibility
 * Wraps the new batch function
 */
export async function batchTranscribeAudio(
    audioUrls: Array<{ questionId: string; audioUrl: string }>
): Promise<Map<string, TranscriptionResult>> {
    // Convert to new format with empty question text
    const inputs = audioUrls.map(a => ({
        questionId: a.questionId,
        audioUrl: a.audioUrl,
        questionText: 'Interview question response',
    }))
    
    const results = await batchTranscribeAndAnalyzeAudio(inputs)
    
    // Convert back to TranscriptionResult (strip analysis)
    const transcriptionResults = new Map<string, TranscriptionResult>()
    results.forEach((result, questionId) => {
        transcriptionResults.set(questionId, {
            success: result.success,
            rawTranscript: result.rawTranscript,
            cleanTranscript: result.cleanTranscript,
            confidence: result.confidence,
            language: result.language,
            error: result.error,
        })
    })
    
    return transcriptionResults
}

export default {
    transcribeAudio,
    transcribeAndAnalyzeAudio,
    analyzeVoiceResponse,
    batchTranscribeAudio,
    batchTranscribeAndAnalyzeAudio,
}
