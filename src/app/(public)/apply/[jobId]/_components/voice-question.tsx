"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Slider } from "@/components/ui/slider"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Mic,
    MicOff,
    Play,
    Pause,
    Square,
    AlertTriangle,
    Clock,
    Eye,
    Send,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { QuestionResponse } from "./store"
import { uploadAudio } from "./actions"

interface Question {
    text: string
    type: "text" | "voice"
    weight: number
    timeLimit?: string
    hideTextUntilRecording?: boolean
}

interface VoiceQuestionProps {
    question: Question
    questionNumber: number
    totalQuestions: number
    onSubmit: (response: {
        type: "voice"
        audioUrl: string
        audioDuration: number
        startedAt: string
        completedAt: string
        isAutoSubmitted: boolean
    }) => void
    // Anti-cheat props
    existingResponse?: QuestionResponse
    readOnly?: boolean
    onNext?: () => void
    onBack?: () => void
}

const parseTimeLimit = (timeLimit?: string): number => {
    if (!timeLimit) return 180 // 3 minutes default
    switch (timeLimit) {
        case "30s":
            return 30
        case "1min":
            return 60
        case "2min":
            return 120
        case "3min":
            return 180
        case "5min":
            return 300
        default:
            return 180
    }
}

export function VoiceQuestion({
    question,
    questionNumber,
    totalQuestions,
    onSubmit,
    existingResponse,
    readOnly = false,
    onNext,
    onBack,
}: VoiceQuestionProps) {
    const { t, locale } = useTranslate()
    const [stage, setStage] = useState<"permission" | "ready" | "countdown" | "recording" | "preview" | "readonly">(
        readOnly ? "readonly" : "permission"
    )
    const [hasPermission, setHasPermission] = useState(false)
    const [countdown, setCountdown] = useState(3)
    const [timeRemaining, setTimeRemaining] = useState(parseTimeLimit(question.timeLimit))
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(existingResponse?.audioUrl || null)
    const [isQuestionRevealed, setIsQuestionRevealed] = useState(!question.hideTextUntilRecording || readOnly)
    const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(5))
    const [isUploading, setIsUploading] = useState(false)

    // Audio playback states
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [audioError, setAudioError] = useState<string | null>(null)
    const [audioLoadAttempts, setAudioLoadAttempts] = useState(0)
    const [showNoRetakeDialog, setShowNoRetakeDialog] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const startTimeRef = useRef<string | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    const isRTL = locale === "ar"
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight
    const ArrowPrev = isRTL ? ArrowRight : ArrowLeft
    const timeLimitSeconds = parseTimeLimit(question.timeLimit)

    // Check if site is secure (HTTPS or localhost/development)
    const [isSecure, setIsSecure] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isHttps = window.location.protocol === 'https:'
            const hostname = window.location.hostname

            // Allow localhost, 127.0.0.1, and local network IPs for development
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
            const isLocalIP = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || // 192.168.x.x
                               /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || // 10.x.x.x
                               /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) // 172.16-31.x.x

            const isDevelopment = process.env.NODE_ENV === 'development'

            const secure = isHttps || isLocalhost || isLocalIP || isDevelopment
            setIsSecure(secure)

            // Detailed logging for debugging
            console.log('[Voice Security] Environment check:', {
                hostname,
                protocol: window.location.protocol,
                isHttps,
                isLocalhost,
                isLocalIP,
                isDevelopment,
                secure,
            })

            if (!secure) {
                console.warn('[Voice Security] ⚠️ Site is not secure (not HTTPS). Microphone access may be blocked.')
            } else if (isLocalIP || isDevelopment) {
                console.log('[Voice Security] ✅ Development mode detected - HTTPS check bypassed')
            }
        }
    }, [])

    // Set initial stage based on readOnly
    useEffect(() => {
        if (readOnly && existingResponse?.audioUrl) {
            setStage("readonly")
            setAudioUrl(existingResponse.audioUrl)
        } else if (!readOnly) {
            setStage("permission")
        }
    }, [readOnly, existingResponse, questionNumber])

    // Reset playback state when stage changes to preview or readonly
    useEffect(() => {
        if (stage === "preview" || stage === "readonly") {
            setIsPlaying(false)
            setCurrentTime(0)
            setDuration(0)
            setAudioError(null)
        }
    }, [stage])

    // Validate audio URL when it changes
    useEffect(() => {
        if (audioUrl && (stage === "preview" || stage === "readonly")) {
            const isBlob = audioUrl.startsWith('blob:')
            const isHttp = audioUrl.startsWith('http')
            const isValid = isBlob || isHttp

            console.log('🎵 Audio URL loaded:', {
                url: audioUrl,
                stage,
                isBlob,
                isHttp,
                isValid,
            })

            // Check if URL is valid (blob URL for preview or http URL for uploaded)
            if (!isValid) {
                console.error('❌ Invalid audio URL:', audioUrl)
                setAudioError('Invalid audio URL format')
                return
            }

            // Try to preload the audio
            if (audioPlayerRef.current) {
                audioPlayerRef.current.load()
            }
        }
    }, [audioUrl, stage])

    // Request microphone permission
    const requestPermission = async () => {
        try {
            console.log('[Voice Permission] Requesting microphone access...')
            console.log('[Voice Permission] User agent:', navigator.userAgent)
            console.log('[Voice Permission] Protocol:', window.location.protocol)
            console.log('[Voice Permission] Hostname:', window.location.hostname)

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('[Voice Permission] getUserMedia not supported')

                // Provide helpful error message based on context
                const hostname = window.location.hostname
                const isLocalIP = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                                  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)

                if (window.location.protocol !== 'https:' && isLocalIP) {
                    toast.error(
                        isRTL
                            ? "يتطلب تسجيل الصوت HTTPS. استخدم localhost أو ngrok للتطوير على الهاتف المحمول."
                            : "Voice recording requires HTTPS. Use localhost or ngrok for mobile development.",
                        { duration: 8000 }
                    )
                } else {
                    toast.error(
                        isRTL
                            ? "متصفحك لا يدعم تسجيل الصوت. استخدم Chrome أو Safari أو Firefox."
                            : "Your browser doesn't support audio recording. Please use Chrome, Safari, or Firefox.",
                        { duration: 6000 }
                    )
                }
                return
            }

            // Request with specific constraints for better mobile compatibility
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            console.log('[Voice Permission] ✅ Microphone access granted')

            streamRef.current = stream
            setHasPermission(true)
            setStage("ready")

            // Setup audio analyser for visualization
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

            // iOS Safari requires AudioContext to be resumed after user interaction
            if (audioContext.state === 'suspended') {
                console.log('[Voice Permission] Resuming suspended AudioContext (iOS fix)')
                await audioContext.resume()
            }

            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 64
            source.connect(analyser)
            analyserRef.current = analyser

            console.log('[Voice Permission] Audio context and analyser setup complete')
        } catch (error: any) {
            console.error('[Voice Permission] ❌ Error:', error)

            let errorMessage = t("apply.microphoneError")

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = "Microphone access denied. Please allow microphone access in your browser settings."
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = "No microphone found. Please connect a microphone and try again."
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = "Microphone is already in use by another application."
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = "Unable to access microphone with the requested settings."
            } else if (error.name === 'SecurityError') {
                errorMessage = "Microphone access blocked. Make sure you're using HTTPS."
            }

            toast.error(errorMessage)
        }
    }

    // Start countdown before recording
    const startCountdown = () => {
        setStage("countdown")
        setIsQuestionRevealed(true)
        setCountdown(3)
    }

    // Get supported MIME type for recording
    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/mpeg',
        ]

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('[Voice Recording] Using MIME type:', type)
                return type
            }
        }

        console.warn('[Voice Recording] No preferred MIME type supported, using default')
        return ''
    }

    // Update audio visualization
    const updateAudioLevels = useCallback(() => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        // Convert to levels for visualization
        const levels = Array.from({ length: 20 }, (_, i) => {
            const start = Math.floor((i / 20) * dataArray.length)
            const end = Math.floor(((i + 1) / 20) * dataArray.length)
            let sum = 0
            for (let j = start; j < end; j++) {
                sum += dataArray[j]
            }
            const avg = sum / (end - start)
            return Math.max(5, Math.min(100, (avg / 255) * 100))
        })

        setAudioLevels(levels)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
    }, [])

    // Start actual recording
    const startRecording = useCallback(() => {
        if (!streamRef.current) {
            console.error('[Voice Recording] No stream available')
            toast.error(t("apply.microphoneError") || "Microphone not available")
            return
        }

        try {
            const mimeType = getSupportedMimeType()
            const options = mimeType ? { mimeType } : undefined

            console.log('[Voice Recording] Creating MediaRecorder with options:', options)
            const mediaRecorder = new MediaRecorder(streamRef.current, options)

            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                console.log('[Voice Recording] Data available:', event.data.size, 'bytes')
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                console.log('[Voice Recording] Recording stopped, chunks:', audioChunksRef.current.length)
                if (audioChunksRef.current.length === 0) {
                    console.error('[Voice Recording] No audio data captured!')
                    toast.error(t("apply.recordingFailed") || "Recording failed - no audio captured")
                    setStage("ready")
                    return
                }

                const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
                console.log('[Voice Recording] Created blob:', blob.size, 'bytes, type:', blob.type)
                setAudioBlob(blob)
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                setStage("preview")
            }

            mediaRecorder.onerror = (event) => {
                console.error('[Voice Recording] MediaRecorder error:', event)
                toast.error(t("apply.recordingError") || "Recording error occurred")
                setStage("ready")
            }

            mediaRecorder.onstart = () => {
                console.log('[Voice Recording] Recording started')
            }

            console.log('[Voice Recording] Starting MediaRecorder...')
            mediaRecorder.start(100) // Collect data every 100ms
            mediaRecorderRef.current = mediaRecorder
            startTimeRef.current = new Date().toISOString()
            setStage("recording")
            setTimeRemaining(timeLimitSeconds)

            // Start audio visualization
            updateAudioLevels()
        } catch (error) {
            console.error('[Voice Recording] Failed to start recording:', error)
            toast.error(t("apply.recordingError") || "Failed to start recording")
            setStage("ready")
        }
    }, [timeLimitSeconds, t, updateAudioLevels])

    /**
     * Converts a Blob to a File object with proper naming
     * This is crucial for the server action to correctly handle the upload
     */
    const blobToFile = useCallback((blob: Blob, fileName: string): File => {
        return new File([blob], fileName, {
            type: blob.type || "audio/webm",
            lastModified: Date.now(),
        })
    }, [])

    // Stop recording
    const stopRecording = useCallback(
        async (isAutoSubmit = false) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop()
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            const duration = startTimeRef.current
                ? (new Date().getTime() - new Date(startTimeRef.current).getTime()) / 1000
                : 0

            if (isAutoSubmit && audioChunksRef.current.length > 0) {
                // Auto-submit when timer runs out
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" })
                setIsUploading(true)

                try {
                    // Convert Blob to File with proper naming
                    const timestamp = Date.now()
                    const audioFile = blobToFile(blob, `recording_q${questionNumber}_${timestamp}.webm`)

                    // Upload audio to cloud storage
                    const formData = new FormData()
                    formData.append("audio", audioFile)
                    formData.append("questionIndex", String(questionNumber - 1))

                    const uploadResult = await uploadAudio(formData)

                    if (!uploadResult.success || !uploadResult.url) {
                        throw new Error(uploadResult.error || "Upload failed")
                    }

                    onSubmit({
                        type: "voice",
                        audioUrl: uploadResult.url,
                        audioDuration: duration,
                        startedAt: startTimeRef.current!,
                        completedAt: new Date().toISOString(),
                        isAutoSubmitted: true,
                    })
                } catch (error) {
                    toast.error(t("apply.uploadError") || "Failed to upload audio")
                    setStage("preview")
                } finally {
                    setIsUploading(false)
                }
            } else {
                setStage("preview")
            }
        },
        [onSubmit, questionNumber, t, blobToFile]
    )

    // Countdown effect
    useEffect(() => {
        if (stage !== "countdown") return

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            startRecording()
        }
    }, [stage, countdown, startRecording])

    // Recording timer effect
    useEffect(() => {
        if (stage !== "recording") return

        if (timeRemaining > 0) {
            const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            toast.info(t("apply.timeUp"))
            stopRecording(true)
        }
    }, [stage, timeRemaining, stopRecording, t])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            // Only revoke if it's a blob URL (not a cloud URL)
            if (audioUrl && audioUrl.startsWith("blob:")) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl])

    const handleSubmit = async () => {
        if (!audioBlob || !startTimeRef.current || readOnly) return

        const duration = (new Date().getTime() - new Date(startTimeRef.current).getTime()) / 1000
        setIsUploading(true)

        try {
            // Convert Blob to File with proper naming
            const timestamp = Date.now()
            const audioFile = blobToFile(audioBlob, `recording_q${questionNumber}_${timestamp}.webm`)

            // Upload audio to cloud storage
            const formData = new FormData()
            formData.append("audio", audioFile)
            formData.append("questionIndex", String(questionNumber - 1))

            const uploadResult = await uploadAudio(formData)

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || "Upload failed")
            }

            onSubmit({
                type: "voice",
                audioUrl: uploadResult.url,
                audioDuration: duration,
                startedAt: startTimeRef.current,
                completedAt: new Date().toISOString(),
                isAutoSubmitted: false,
            })
        } catch (error) {
            toast.error(t("apply.uploadError") || "Failed to upload audio")
        } finally {
            setIsUploading(false)
        }
    }

    const handleNext = () => {
        if (onNext) {
            onNext()
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Audio playback handlers
    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget
        setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget
        setAudioError(null)
        // Handle Infinity duration (common with Blobs) by seeking to resolve it
        if (audio.duration === Infinity || isNaN(audio.duration)) {
            // Force seek to end to get real duration (blob audio workaround)
            audio.currentTime = 1e101
            audio.addEventListener('timeupdate', function getDuration() {
                audio.currentTime = 0
                if (audio.duration !== Infinity && !isNaN(audio.duration)) {
                    setDuration(audio.duration)
                }
                audio.removeEventListener('timeupdate', getDuration)
            }, { once: true })
        } else {
            setDuration(audio.duration)
        }
    }

    const handleDurationChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget
        if (audio.duration !== Infinity && !isNaN(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
    }

    const handlePlay = () => {
        setIsPlaying(true)
        setAudioError(null)
    }

    const handlePause = () => {
        setIsPlaying(false)
    }

    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audio = e.currentTarget
        let errorMessage = 'Failed to load audio'
        let errorDetails = ''

        // Get all source elements to check which formats were tried
        const sources = Array.from(audio.querySelectorAll('source')).map(s => ({
            src: s.src,
            type: s.type,
        }))

        console.error('Audio element error:', {
            audioUrl: audio.src || audioUrl,
            sources,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message,
            networkState: audio.networkState,
            readyState: audio.readyState,
            canPlayType_webm: audio.canPlayType('audio/webm'),
            canPlayType_ogg: audio.canPlayType('audio/ogg'),
            canPlayType_mp4: audio.canPlayType('audio/mp4'),
            canPlayType_mpeg: audio.canPlayType('audio/mpeg'),
        })

        if (audio.error) {
            switch (audio.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Audio loading was aborted'
                    errorDetails = 'The audio download was interrupted'
                    break
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error while loading audio'
                    errorDetails = 'Check your internet connection and try again'
                    break
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'Audio file is corrupted or in an unsupported format'
                    errorDetails = 'The audio file may be damaged'
                    break
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Audio format not supported by your browser'
                    errorDetails = 'Try using a different browser (Chrome, Firefox, or Safari)'
                    break
                default:
                    errorMessage = 'Unknown error loading audio'
                    errorDetails = audio.error.message || 'Please try refreshing the page'
            }
        }

        // Log full error details for debugging
        console.error('Audio error details:', {
            message: errorMessage,
            details: errorDetails,
            url: audio.src,
            error: audio.error,
            attempts: audioLoadAttempts,
        })

        // Try to reload the audio once if it's a network error
        if (audio.error?.code === MediaError.MEDIA_ERR_NETWORK && audioLoadAttempts < 1) {
            console.log('🔄 Retrying audio load...')
            setAudioLoadAttempts(prev => prev + 1)
            setTimeout(() => {
                if (audioPlayerRef.current) {
                    audioPlayerRef.current.load()
                }
            }, 1000)
            return
        }

        setAudioError(errorMessage)
        setIsPlaying(false)
        toast.error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`)
    }

    const handlePlayPause = async () => {
        if (audioPlayerRef.current) {
            try {
                if (isPlaying) {
                    audioPlayerRef.current.pause()
                } else {
                    setAudioError(null)
                    await audioPlayerRef.current.play()
                }
            } catch (error) {
                console.error('Audio playback error:', error)
                setAudioError('Failed to play audio. The file may be corrupted or in an unsupported format.')
                setIsPlaying(false)
                toast.error('Failed to play audio recording')
            }
        }
    }

    const handleSeek = (value: number[]) => {
        if (audioPlayerRef.current && duration > 0) {
            const newTime = (value[0] / 100) * duration
            audioPlayerRef.current.currentTime = newTime
            setCurrentTime(newTime)
        }
    }

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
    const recordingProgressPercent = ((timeLimitSeconds - timeRemaining) / timeLimitSeconds) * 100

    return (
        <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between mb-4">
                    <Badge
                        variant="secondary"
                        className={cn(
                            "gap-1.5",
                            stage === "recording" && "bg-red-500/20 text-red-500 border-red-500/30"
                        )}
                    >
                        <Mic className={cn("size-3", stage === "recording" && "animate-pulse")} />
                        {t("apply.voiceQuestion")}
                    </Badge>
                    <div className="flex items-center gap-2">
                        {readOnly && (
                            <Badge
                                variant="outline"
                                className="gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                            >
                                <CheckCircle2 className="size-3" />
                                {t("apply.answered") || "Answered"}
                            </Badge>
                        )}
                        <Badge variant="outline">
                            {questionNumber} / {totalQuestions}
                        </Badge>
                    </div>
                </div>

                {/* Question text - hidden or revealed based on settings */}
                {!isQuestionRevealed ? (
                    <div className="p-6 rounded-lg bg-muted/50 border border-dashed border-border text-center">
                        <Eye className="size-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">{t("apply.questionHidden")}</p>
                    </div>
                ) : (
                    <CardTitle className="text-xl leading-relaxed animate-in fade-in duration-500" dir="auto">
                        {question.text}
                    </CardTitle>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Read-Only Mode - Show existing recording */}
                {stage === "readonly" && (
                    <div className="space-y-6">
                        {/* Read-Only Warning */}
                        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                            <Lock className="size-4 text-amber-600" />
                            <AlertDescription className="text-amber-700 dark:text-amber-300">
                                {t("apply.readOnlyVoiceWarning") ||
                                    "This question has already been answered. You can listen to your recording but cannot re-record."}
                            </AlertDescription>
                        </Alert>

                        <div className="text-center">
                            <div className="size-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="size-8 text-green-500" />
                            </div>
                            <h3 className="font-semibold mb-1">{t("apply.yourRecording") || "Your Recording"}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t("apply.listenToRecording") || "Listen to your submitted answer below"}
                            </p>
                        </div>

                        {/* Audio player */}
                        {audioUrl ? (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                {audioUrl.startsWith('blob:') ? (
                                    // For blob URLs, use direct src attribute
                                    <audio
                                        ref={audioPlayerRef}
                                        src={audioUrl}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onDurationChange={handleDurationChange}
                                        onEnded={handleEnded}
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onError={handleAudioError}
                                        onLoadStart={() => console.log('🎵 Readonly audio (blob) load started')}
                                        onCanPlay={() => console.log('✅ Readonly audio (blob) can play')}
                                        preload="metadata"
                                        className="hidden"
                                    />
                                ) : (
                                    // For HTTP URLs, use multiple sources for compatibility
                                    <audio
                                        ref={audioPlayerRef}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onDurationChange={handleDurationChange}
                                        onEnded={handleEnded}
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onError={handleAudioError}
                                        onLoadStart={() => console.log('🎵 Readonly audio (http) load started:', audioUrl)}
                                        onCanPlay={() => console.log('✅ Readonly audio (http) can play')}
                                        onCanPlayThrough={() => console.log('✅ Readonly audio (http) can play through')}
                                        preload="metadata"
                                        className="hidden"
                                    >
                                        <source src={audioUrl} type="audio/webm" />
                                        <source src={audioUrl} type="audio/ogg" />
                                        <source src={audioUrl} type="audio/mp4" />
                                        <source src={audioUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                )}
                                {audioError && (
                                    <div className="text-xs text-red-500 flex items-center gap-1 justify-center">
                                        <AlertTriangle className="h-3 w-3" />
                                        {audioError}
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={handlePlayPause}
                                        className="shrink-0"
                                    >
                                        {isPlaying ? (
                                            <Pause className="size-4" />
                                        ) : (
                                            <Play className="size-4" />
                                        )}
                                    </Button>
                                    <div className="flex-1 space-y-1">
                                        <Slider
                                            value={[progressPercent]}
                                            onValueChange={handleSeek}
                                            max={100}
                                            step={0.1}
                                            className="cursor-pointer"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
                                            <span>{formatTime(Math.floor(currentTime))}</span>
                                            <span>{formatTime(Math.floor(duration))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-muted/50 text-center text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{t("apply.noAudioAvailable") || "No audio recording available"}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {onBack && (
                                <Button size="lg" variant="outline" className="h-12 text-base gap-2" onClick={onBack}>
                                    {!isRTL && t("common.back")}
                                    <ArrowPrev className="size-4" />
                                    {isRTL && t("common.back")}
                                </Button>
                            )}
                            <Button size="lg" className="flex-1 h-12 text-base gap-2" dir={isRTL ? "rtl" : "ltr"} onClick={handleNext}>
                                <span>
                                    {questionNumber < totalQuestions
                                        ? t("apply.nextQuestion")
                                        : (t("apply.continueToUpload") || "Continue")
                                    }
                                </span>
                                <ArrowIcon className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Permission Request */}
                {stage === "permission" && !readOnly && (
                    <div className="space-y-4">
                        <div className="text-center space-y-4">
                            <div className="size-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <Mic className="size-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">{t("apply.microphoneAccess")}</h3>
                                <p className="text-sm text-muted-foreground">{t("apply.microphoneAccessDescription")}</p>
                            </div>
                        </div>

                        {/* HTTPS Security Warning - Only show on production or non-local IPs */}
                        {!isSecure && typeof window !== 'undefined' && window.location.protocol !== 'https:' && (
                            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-sm text-red-700 dark:text-red-300">
                                    {isRTL ? (
                                        <>
                                            <strong>تحذير:</strong> يتطلب تسجيل الصوت HTTPS. للتطوير استخدم:
                                            <br />
                                            • localhost (http://localhost:3000)
                                            <br />
                                            • ngrok للاختبار على الهاتف
                                        </>
                                    ) : (
                                        <>
                                            <strong>Warning:</strong> Voice recording requires HTTPS. For development use:
                                            <br />
                                            • localhost (http://localhost:3000)
                                            <br />
                                            • ngrok for mobile testing
                                        </>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Mobile-specific instructions */}
                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                                {isRTL ? (
                                    <>
                                        <strong>للأجهزة المحمولة:</strong> عند النقر على "السماح بالميكروفون"، ستظهر نافذة منبثقة من المتصفح. يرجى النقر على "السماح" أو "Allow" لمنح الإذن.
                                    </>
                                ) : (
                                    <>
                                        <strong>For mobile users:</strong> When you tap "Allow Microphone", your browser will show a popup. Please tap "Allow" to grant permission.
                                    </>
                                )}
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            {onBack && (
                                <Button size="lg" variant="outline" className="h-12 text-base gap-2" onClick={onBack}>
                                    {!isRTL && t("common.back")}
                                    <ArrowPrev className="size-4" />
                                    {isRTL && t("common.back")}
                                </Button>
                            )}
                            <Button
                                onClick={requestPermission}
                                size="lg"
                                className="flex-1 h-12 text-base gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            >
                                <Mic className="size-4" />
                                {t("apply.allowMicrophone")}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Ready to Record */}
                {stage === "ready" && !readOnly && (
                    <div className="space-y-4">
                        <div className="text-center space-y-4">
                            <div className="size-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="size-10 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">{t("apply.readyToRecord")}</h3>
                                <p className="text-sm text-muted-foreground">{t("apply.readyToRecordDescription")}</p>
                                <div className="flex items-center justify-center gap-2 mt-2 text-amber-500">
                                    <Clock className="size-4" />
                                    <span className="text-sm font-medium">
                                        {formatTime(timeLimitSeconds)} {t("apply.timeLimit")}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-start">
                                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-600 dark:text-amber-400">{t("apply.noRetakeWarning")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {onBack && (
                                <Button size="lg" variant="outline" className="h-12 text-base gap-2" onClick={onBack}>
                                    {!isRTL && t("common.back")}
                                    <ArrowPrev className="size-4" />
                                    {isRTL && t("common.back")}
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowNoRetakeDialog(true)}
                                size="lg"
                                className="flex-1 h-12 text-base gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            >
                                <Play className="size-4" />
                                {t("apply.startRecording")}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Countdown */}
                {stage === "countdown" && !readOnly && (
                    <div className="text-center py-8">
                        <div className="size-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                            <span className="text-6xl font-bold text-primary">{countdown}</span>
                        </div>
                        <p className="mt-4 text-muted-foreground">{t("apply.getReady")}</p>
                    </div>
                )}

                {/* Recording */}
                {stage === "recording" && !readOnly && (
                    <div className="space-y-6">
                        {/* Timer */}
                        <div className="text-center">
                            <div
                                className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                                    timeRemaining <= 30 ? "bg-red-500/20 text-red-500" : "bg-muted"
                                )}
                            >
                                <Clock className="size-5" />
                                <span className="text-2xl font-mono font-bold">{formatTime(timeRemaining)}</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <Progress
                            value={recordingProgressPercent}
                            className={cn("h-2", timeRemaining <= 30 && "[&>div]:bg-red-500")}
                        />

                        {/* Audio Visualizer */}
                        <div className="flex items-center justify-center gap-1 h-24 px-4">
                            {audioLevels.map((level, i) => (
                                <div
                                    key={i}
                                    className="w-2 bg-primary rounded-full transition-all duration-75"
                                    style={{
                                        height: `${level}%`,
                                        opacity: 0.5 + level / 200,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Recording indicator */}
                        <div className="flex items-center justify-center gap-2">
                            <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm text-muted-foreground">{t("apply.recording")}</span>
                        </div>

                        {/* Stop button */}
                        <Button
                            onClick={() => stopRecording(false)}
                            size="lg"
                            variant="destructive"
                            className="w-full gap-2"
                        >
                            <Square className="size-4" />
                            {t("apply.stopRecording")}
                        </Button>
                    </div>
                )}

                {/* Preview */}
                {stage === "preview" && !readOnly && audioUrl && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="size-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="size-8 text-green-500" />
                            </div>
                            <h3 className="font-semibold mb-1">{t("apply.recordingComplete")}</h3>
                            <p className="text-sm text-muted-foreground">{t("apply.recordingCompleteDescription")}</p>
                        </div>

                        {/* Audio player */}
                        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                            {audioUrl?.startsWith('blob:') ? (
                                // For blob URLs (preview), use direct src attribute
                                <audio
                                    ref={audioPlayerRef}
                                    src={audioUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onDurationChange={handleDurationChange}
                                    onEnded={handleEnded}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onError={handleAudioError}
                                    onLoadStart={() => console.log('🎵 Preview audio (blob) load started')}
                                    onCanPlay={() => console.log('✅ Preview audio (blob) can play')}
                                    preload="metadata"
                                    className="hidden"
                                />
                            ) : (
                                // For HTTP URLs (uploaded), use multiple sources for compatibility
                                <audio
                                    ref={audioPlayerRef}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onDurationChange={handleDurationChange}
                                    onEnded={handleEnded}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onError={handleAudioError}
                                    onLoadStart={() => console.log('🎵 Preview audio (http) load started:', audioUrl)}
                                    onCanPlay={() => console.log('✅ Preview audio (http) can play')}
                                    preload="metadata"
                                    className="hidden"
                                >
                                    <source src={audioUrl || ''} type="audio/webm" />
                                    <source src={audioUrl || ''} type="audio/ogg" />
                                    <source src={audioUrl || ''} type="audio/mp4" />
                                    <source src={audioUrl || ''} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            )}
                            {audioError && (
                                <div className="text-xs text-red-500 flex items-center gap-1 justify-center">
                                    <AlertTriangle className="h-3 w-3" />
                                    {audioError}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handlePlayPause}
                                    className="shrink-0"
                                >
                                    {isPlaying ? (
                                        <Pause className="size-4" />
                                    ) : (
                                        <Play className="size-4" />
                                    )}
                                </Button>
                                <div className="flex-1 space-y-1">
                                    <Slider
                                        value={[progressPercent]}
                                        onValueChange={handleSeek}
                                        max={100}
                                        step={0.1}
                                        className="cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
                                        <span>{formatTime(Math.floor(currentTime))}</span>
                                        <span>{formatTime(Math.floor(duration))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {onBack && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-12 text-base gap-2"
                                    onClick={onBack}
                                    disabled={isUploading}
                                >
                                    {!isRTL && t("common.back")}
                                    <ArrowPrev className="size-4" />
                                    {isRTL && t("common.back")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSubmit}
                                size="lg"
                                className="flex-1 h-12 text-base gap-2"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Spinner className="size-4" />
                                        {t("apply.uploading") || "Uploading..."}
                                    </>
                                ) : questionNumber < totalQuestions ? (
                                    <>
                                        {t("apply.nextQuestion")}
                                        <ArrowIcon className="size-4" />
                                    </>
                                ) : (
                                    <>
                                        {t("apply.submitAnswer")}
                                        <Send className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* No Retake Warning Dialog */}
            <AlertDialog open={showNoRetakeDialog} onOpenChange={setShowNoRetakeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-6" />
                            {t("apply.noRetakeDialogTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base leading-relaxed pt-2">
                            {t("apply.noRetakeDialogDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("apply.noRetakeDialogCancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowNoRetakeDialog(false)
                                startCountdown()
                            }}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                            {t("apply.noRetakeDialogConfirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
