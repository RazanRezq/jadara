"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import {
    Mic,
    MicOff,
    Play,
    Square,
    AlertTriangle,
    Clock,
    Eye,
    Send,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
        audioBlob: Blob
        audioDuration: number
        startedAt: Date
        completedAt: Date
        isAutoSubmitted: boolean
    }) => void
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
}: VoiceQuestionProps) {
    const { t, locale } = useTranslate()
    const [stage, setStage] = useState<"permission" | "ready" | "countdown" | "recording" | "preview">("permission")
    const [hasPermission, setHasPermission] = useState(false)
    const [countdown, setCountdown] = useState(3)
    const [timeRemaining, setTimeRemaining] = useState(parseTimeLimit(question.timeLimit))
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isQuestionRevealed, setIsQuestionRevealed] = useState(!question.hideTextUntilRecording)
    const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(5))
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const startTimeRef = useRef<Date | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const isRTL = locale === "ar"
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight
    const timeLimitSeconds = parseTimeLimit(question.timeLimit)

    // Request microphone permission
    const requestPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            setHasPermission(true)
            setStage("ready")
            
            // Setup audio analyser for visualization
            const audioContext = new AudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 64
            source.connect(analyser)
            analyserRef.current = analyser
        } catch {
            toast.error(t("apply.microphoneError"))
        }
    }

    // Start countdown before recording
    const startCountdown = () => {
        setStage("countdown")
        setIsQuestionRevealed(true)
        setCountdown(3)
    }

    // Start actual recording
    const startRecording = useCallback(() => {
        if (!streamRef.current) return

        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: "audio/webm;codecs=opus",
        })
        
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data)
            }
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
            setAudioBlob(blob)
            setAudioUrl(URL.createObjectURL(blob))
        }

        mediaRecorder.start(100) // Collect data every 100ms
        mediaRecorderRef.current = mediaRecorder
        startTimeRef.current = new Date()
        setStage("recording")
        setTimeRemaining(timeLimitSeconds)

        // Start audio visualization
        updateAudioLevels()
    }, [timeLimitSeconds])

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

    // Stop recording
    const stopRecording = useCallback((isAutoSubmit = false) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        }
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        const duration = startTimeRef.current
            ? (new Date().getTime() - startTimeRef.current.getTime()) / 1000
            : 0

        if (isAutoSubmit && audioChunksRef.current.length > 0) {
            // Auto-submit when timer runs out
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
            onSubmit({
                type: "voice",
                audioBlob: blob,
                audioDuration: duration,
                startedAt: startTimeRef.current!,
                completedAt: new Date(),
                isAutoSubmitted: true,
            })
        } else {
            setStage("preview")
        }
    }, [onSubmit])

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
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl])

    const handleSubmit = () => {
        if (!audioBlob || !startTimeRef.current) return

        const duration = (new Date().getTime() - startTimeRef.current.getTime()) / 1000

        onSubmit({
            type: "voice",
            audioBlob,
            audioDuration: duration,
            startedAt: startTimeRef.current,
            completedAt: new Date(),
            isAutoSubmitted: false,
        })
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progressPercent = ((timeLimitSeconds - timeRemaining) / timeLimitSeconds) * 100

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
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
                    <Badge variant="outline">
                        {questionNumber} / {totalQuestions}
                    </Badge>
                </div>

                {/* Question text - hidden or revealed based on settings */}
                {!isQuestionRevealed ? (
                    <div className="p-6 rounded-lg bg-muted/50 border border-dashed border-border text-center">
                        <Eye className="size-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            {t("apply.questionHidden")}
                        </p>
                    </div>
                ) : (
                    <CardTitle className="text-xl leading-relaxed animate-in fade-in duration-500">
                        {question.text}
                    </CardTitle>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Permission Request */}
                {stage === "permission" && (
                    <div className="text-center space-y-4">
                        <div className="size-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Mic className="size-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">
                                {t("apply.microphoneAccess")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t("apply.microphoneAccessDescription")}
                            </p>
                        </div>
                        <Button onClick={requestPermission} size="lg" className="gap-2">
                            <Mic className="size-4" />
                            {t("apply.allowMicrophone")}
                        </Button>
                    </div>
                )}

                {/* Ready to Record */}
                {stage === "ready" && (
                    <div className="text-center space-y-4">
                        <div className="size-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="size-10 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">
                                {t("apply.readyToRecord")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t("apply.readyToRecordDescription")}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-2 text-amber-500">
                                <Clock className="size-4" />
                                <span className="text-sm font-medium">
                                    {formatTime(timeLimitSeconds)} {t("apply.timeLimit")}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-start">
                            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                {t("apply.noRetakeWarning")}
                            </p>
                        </div>
                        <Button
                            onClick={startCountdown}
                            size="lg"
                            className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                            <Play className="size-4" />
                            {t("apply.startRecording")}
                        </Button>
                    </div>
                )}

                {/* Countdown */}
                {stage === "countdown" && (
                    <div className="text-center py-8">
                        <div className="size-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                            <span className="text-6xl font-bold text-primary">
                                {countdown}
                            </span>
                        </div>
                        <p className="mt-4 text-muted-foreground">
                            {t("apply.getReady")}
                        </p>
                    </div>
                )}

                {/* Recording */}
                {stage === "recording" && (
                    <div className="space-y-6">
                        {/* Timer */}
                        <div className="text-center">
                            <div
                                className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                                    timeRemaining <= 30
                                        ? "bg-red-500/20 text-red-500"
                                        : "bg-muted"
                                )}
                            >
                                <Clock className="size-5" />
                                <span className="text-2xl font-mono font-bold">
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <Progress
                            value={progressPercent}
                            className={cn(
                                "h-2",
                                timeRemaining <= 30 && "[&>div]:bg-red-500"
                            )}
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
                            <span className="text-sm text-muted-foreground">
                                {t("apply.recording")}
                            </span>
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
                {stage === "preview" && audioUrl && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="size-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="size-8 text-green-500" />
                            </div>
                            <h3 className="font-semibold mb-1">
                                {t("apply.recordingComplete")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t("apply.recordingCompleteDescription")}
                            </p>
                        </div>

                        {/* Audio player */}
                        <div className="p-4 rounded-lg bg-muted/50">
                            <audio src={audioUrl} controls className="w-full" />
                        </div>

                        <Button
                            onClick={handleSubmit}
                            size="lg"
                            className="w-full h-12 text-base gap-2"
                        >
                            {questionNumber < totalQuestions ? (
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
                )}
            </CardContent>
        </Card>
    )
}

