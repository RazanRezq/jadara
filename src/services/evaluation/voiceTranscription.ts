/**
 * SmartRecruit AI - Voice Transcription Service
 * Uses OpenAI Whisper API for Speech-to-Text with Arabic/English support
 * Provides dual output: raw transcript and cleaned transcript
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { TranscriptionResult, VoiceAnalysisResult } from './types'

// Initialize Gemini for cleaning and analysis (Whisper for transcription)
const GEMINI_MODEL = 'gemini-2.5-flash-lite'

interface WhisperResponse {
    text: string
    language?: string
    duration?: number
    segments?: Array<{
        text: string
        start: number
        end: number
    }>
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Supports Arabic and English
 */
export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
    try {
        const openaiKey = process.env.OPENAI_API_KEY
        
        if (!openaiKey) {
            console.error('❌ [Transcription] CRITICAL ERROR: OPENAI_API_KEY not found in environment variables')
            console.error('❌ [Transcription] Please add OPENAI_API_KEY to your .env.local file')
            return {
                success: false,
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.',
            }
        }

        console.log('🎤 [Transcription] ============================================')
        console.log('🎤 [Transcription] Starting transcription for audio URL:', audioUrl)
        console.log('🎤 [Transcription] OpenAI API Key present:', openaiKey ? 'YES (length: ' + openaiKey.length + ')' : 'NO')
        console.log('🎤 [Transcription] Test accessibility with: curl -I "' + audioUrl + '"')

        // Fetch the audio file
        console.log('🎤 [Transcription] Step 1: Fetching audio file from URL...')
        const audioResponse = await fetch(audioUrl)
        console.log('🎤 [Transcription] Audio fetch response status:', audioResponse.status, audioResponse.statusText)
        console.log('🎤 [Transcription] Audio fetch response headers:', Object.fromEntries(audioResponse.headers.entries()))
        
        if (!audioResponse.ok) {
            console.error('❌ [Transcription] Failed to fetch audio file')
            console.error('❌ [Transcription] Status:', audioResponse.status, audioResponse.statusText)
            console.error('❌ [Transcription] URL was:', audioUrl)
            return {
                success: false,
                error: `Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`,
            }
        }

        const audioBlob = await audioResponse.blob()
        console.log('🎤 [Transcription] Step 2: Audio blob created, size:', audioBlob.size, 'bytes, type:', audioBlob.type)
        
        if (audioBlob.size === 0) {
            console.error('❌ [Transcription] Audio blob is empty (0 bytes)!')
            return {
                success: false,
                error: 'Audio file is empty',
            }
        }
        
        // Create form data for Whisper API
        console.log('🎤 [Transcription] Step 3: Creating FormData for Whisper API...')
        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.webm')
        formData.append('model', 'whisper-1')
        formData.append('response_format', 'verbose_json')
        // Don't specify language - let Whisper auto-detect for Arabic/English support

        // Call OpenAI Whisper API
        console.log('🎤 [Transcription] Step 4: Calling OpenAI Whisper API...')
        console.log('🎤 [Transcription] API Endpoint: https://api.openai.com/v1/audio/transcriptions')
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: formData,
        })

        console.log('🎤 [Transcription] Whisper API response status:', whisperResponse.status, whisperResponse.statusText)
        
        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text()
            console.error('❌ [Transcription] Whisper API error response:', errorText)
            console.error('❌ [Transcription] Status code:', whisperResponse.status)
            console.error('❌ [Transcription] Status text:', whisperResponse.statusText)
            return {
                success: false,
                error: `Whisper API error: ${whisperResponse.status} - ${errorText}`,
            }
        }

        console.log('🎤 [Transcription] Step 5: Parsing Whisper API response...')
        const whisperResult: WhisperResponse = await whisperResponse.json()
        const rawTranscript = whisperResult.text

        console.log('✅ [Transcription] SUCCESS! Transcription completed')
        console.log('✅ [Transcription] Raw transcript length:', rawTranscript.length, 'characters')
        console.log('✅ [Transcription] Detected language:', whisperResult.language)
        console.log('✅ [Transcription] Duration:', whisperResult.duration, 'seconds')
        console.log('✅ [Transcription] First 100 chars:', rawTranscript.substring(0, 100))

        // Clean the transcript using Gemini
        console.log('🎤 [Transcription] Step 6: Cleaning transcript with Gemini...')
        const cleanedText = await cleanTranscriptText(rawTranscript, whisperResult.language || 'auto')
        console.log('✅ [Transcription] Cleaned transcript length:', cleanedText.length, 'characters')
        console.log('🎤 [Transcription] ============================================')

        return {
            success: true,
            rawTranscript,
            cleanTranscript: cleanedText,
            confidence: 0.95, // Whisper doesn't provide confidence, using high default
            language: whisperResult.language,
            duration: whisperResult.duration,
        }
    } catch (error) {
        console.error('❌ [Transcription] EXCEPTION CAUGHT:', error)
        console.error('❌ [Transcription] Error name:', error instanceof Error ? error.name : 'Unknown')
        console.error('❌ [Transcription] Error message:', error instanceof Error ? error.message : 'Unknown')
        console.error('❌ [Transcription] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown transcription error',
        }
    }
}

/**
 * Clean transcript by removing filler words and correcting grammar
 */
async function cleanTranscriptText(rawText: string, language: string): Promise<string> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            console.warn('[Transcription] GOOGLE_API_KEY not found, returning raw transcript')
            return rawText
        }

        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(rawText)

        const prompt = `You are a transcript editor. Clean the following transcript by:
1. Removing filler words (umm, ahh, uhh, uh, um, like, you know, يعني, آه, إيه, امممم)
2. Correcting minor grammar issues
3. Fixing sentence structure while preserving the speaker's meaning
4. Keeping the same language (${isArabic ? 'Arabic' : 'English'})
5. DO NOT add any new content or change the meaning
6. DO NOT translate - keep in the original language
7. Keep it natural and conversational, just cleaner

Original transcript:
${rawText}

Cleaned transcript (output ONLY the cleaned text, no explanations):`

        const result = await model.generateContent(prompt)
        const cleanedText = result.response.text().trim()

        console.log('[Transcription] Cleaned transcript generated')
        return cleanedText || rawText
    } catch (error) {
        console.error('[Transcription] Error cleaning transcript:', error)
        return rawText // Return raw if cleaning fails
    }
}

/**
 * Analyze voice response for sentiment and confidence
 */
export async function analyzeVoiceResponse(
    rawTranscript: string,
    cleanTranscript: string,
    questionText: string,
    audioDuration?: number
): Promise<VoiceAnalysisResult> {
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
 * Batch transcribe multiple audio files
 */
export async function batchTranscribeAudio(
    audioUrls: Array<{ questionId: string; audioUrl: string }>
): Promise<Map<string, TranscriptionResult>> {
    console.log('🔄 [Batch Transcription] ============================================')
    console.log('🔄 [Batch Transcription] Starting batch transcription for', audioUrls.length, 'audio files')
    
    const results = new Map<string, TranscriptionResult>()
    
    // Process in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 3
    const chunks = []
    
    for (let i = 0; i < audioUrls.length; i += CONCURRENCY_LIMIT) {
        chunks.push(audioUrls.slice(i, i + CONCURRENCY_LIMIT))
    }

    console.log('🔄 [Batch Transcription] Processing in', chunks.length, 'chunks with concurrency limit:', CONCURRENCY_LIMIT)

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]
        console.log(`🔄 [Batch Transcription] Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} files)`)
        
        const chunkResults = await Promise.all(
            chunk.map(async ({ questionId, audioUrl }) => {
                console.log(`🔄 [Batch Transcription] Transcribing question: ${questionId}`)
                const result = await transcribeAudio(audioUrl)
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

export default {
    transcribeAudio,
    analyzeVoiceResponse,
    batchTranscribeAudio,
}

