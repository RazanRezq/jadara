"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { type UserRole } from "@/lib/auth"
import { toast } from "sonner"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    DollarSign,
    Mic,
    Globe,
    Linkedin,
    Star,
    CheckCircle,
    FileText,
    AlertTriangle,
    XCircle,
    Clock,
    Sparkles,
    Play,
    Pause,
    Volume2,
    CalendarPlus,
    MessageSquare,
    ShieldAlert,
    Languages,
    Brain,
    TrendingUp,
    Target,
} from "lucide-react"
import type { Applicant, ApplicantStatus, EvaluationData, BilingualText, BilingualTextArray } from "./applicants-client"

interface VoiceResponse {
    questionId: string
    audioUrl?: string
    rawTranscript?: string
    cleanTranscript?: string
    audioDuration?: number
}

interface ViewApplicantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicant: Applicant
    evaluation?: EvaluationData
    userRole: UserRole
    userId: string
    onStatusChange: () => void
}

const statusColors: Record<ApplicantStatus, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    screening: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    interviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    evaluated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export function ViewApplicantDialog({
    open,
    onOpenChange,
    applicant,
    evaluation,
    userRole,
    userId,
    onStatusChange,
}: ViewApplicantDialogProps) {
    const { t, isRTL, locale } = useTranslate()
    const [updating, setUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<ApplicantStatus>(applicant.status)
    const [voiceResponses, setVoiceResponses] = useState<VoiceResponse[]>([])
    const [loadingResponses, setLoadingResponses] = useState(false)
    const [jobData, setJobData] = useState<{
        screeningQuestions?: Array<{ question: string; disqualify: boolean }>
        languages?: Array<{ language: string; level: string }>
    } | null>(null)

    // Helper to get bilingual text based on current locale
    const getLocalizedText = (text: BilingualText | string | undefined): string => {
        if (!text) return ''
        if (typeof text === 'string') return text // Legacy format
        return locale === 'ar' ? (text.ar || text.en) : (text.en || text.ar)
    }

    // Helper to get bilingual array based on current locale
    const getLocalizedArray = (arr: BilingualTextArray | string[] | undefined): string[] => {
        if (!arr) return []
        if (Array.isArray(arr)) return arr // Legacy format
        return locale === 'ar' ? (arr.ar || arr.en || []) : (arr.en || arr.ar || [])
    }

    // DEBUG: Log evaluation and applicant data
    useEffect(() => {
        if (evaluation) {
            console.log('🔍 EVALUATION DEBUG:', {
                applicantId: applicant.id,
                applicantName: applicant.personalData.name,
                hasVoiceAnalysis: !!evaluation.voiceAnalysisDetails,
                voiceAnalysisLength: evaluation.voiceAnalysisDetails?.length,
                voiceAnalysisData: evaluation.voiceAnalysisDetails,
                hasSocialInsights: !!evaluation.socialProfileInsights,
                socialInsightsData: evaluation.socialProfileInsights,
                hasTextAnalysis: !!evaluation.textResponseAnalysis,
                textAnalysisData: evaluation.textResponseAnalysis,
                hasScreeningAnswers: !!applicant.personalData.screeningAnswers,
                screeningAnswersData: applicant.personalData.screeningAnswers,
                hasLanguageProficiency: !!applicant.personalData.languageProficiency,
                languageProficiencyData: applicant.personalData.languageProficiency,
                hasNotes: !!applicant.notes,
                notesValue: applicant.notes,
                notesLength: applicant.notes?.length,
                fullEvaluation: evaluation
            })
        }
    }, [evaluation, applicant])

    // Audio player states - track per response
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null)
    const [audioStates, setAudioStates] = useState<Record<string, { currentTime: number; duration: number; error: string | null }>>({})
    const [transcriptView, setTranscriptView] = useState<'clean' | 'raw'>('clean')
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

    const isReviewer = userRole === "reviewer"
    const score = evaluation?.overallScore ?? applicant.aiScore

    // Fetch job data for comparison
    useEffect(() => {
        if (open && applicant.jobId?._id) {
            fetchJobData()
        }
    }, [open, applicant.jobId?._id])

    const fetchJobData = async () => {
        try {
            const response = await fetch(`/api/jobs/${applicant.jobId?._id}`)
            const data = await response.json()
            if (data.success && data.job) {
                setJobData({
                    screeningQuestions: data.job.screeningQuestions || [],
                    languages: data.job.languages || [],
                })
            }
        } catch (error) {
            console.error('Failed to fetch job data:', error)
        }
    }

    // Fetch voice responses
    useEffect(() => {
        if (open) {
            fetchVoiceResponses()
        }
    }, [open, applicant.id])

    const fetchVoiceResponses = async () => {
        setLoadingResponses(true)
        try {
            const response = await fetch(`/api/responses/by-applicant/${applicant.id}`)
            const data = await response.json()
            if (data.success) {
                const voiceOnly = data.responses.filter((r: VoiceResponse) => r.audioUrl)
                setVoiceResponses(voiceOnly)
            }
        } catch (error) {
            console.error("Failed to fetch responses:", error)
        } finally {
            setLoadingResponses(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true)
        try {
            const response = await fetch(
                `/api/applicants/update/${applicant.id}?userId=${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            )

            const data = await response.json()

            if (data.success) {
                setCurrentStatus(newStatus as ApplicantStatus)
                toast.success(t("applicants.statusUpdated"))
                onStatusChange()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Update status error:", error)
            toast.error(t("common.error"))
        } finally {
            setUpdating(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getScoreColor = (score?: number) => {
        if (!score) return "text-muted-foreground"
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400"
        if (score >= 50) return "text-amber-600 dark:text-amber-400"
        return "text-red-600 dark:text-red-400"
    }

    const getScoreBgColor = (score?: number) => {
        if (!score) return "bg-muted"
        if (score >= 75) return "bg-emerald-500"
        if (score >= 50) return "bg-amber-500"
        return "bg-red-500"
    }

    // Audio controls - per response
    const togglePlay = async (responseId: string) => {
        const audioElement = audioRefs.current[responseId]
        if (!audioElement) return

        try {
            // If another audio is playing, pause it first
            if (currentlyPlayingId && currentlyPlayingId !== responseId) {
                const otherAudio = audioRefs.current[currentlyPlayingId]
                if (otherAudio) {
                    otherAudio.pause()
                }
            }

            if (currentlyPlayingId === responseId) {
                // Currently playing this one, pause it
                audioElement.pause()
                setCurrentlyPlayingId(null)
            } else {
                // Start playing this one
                setAudioStates(prev => ({
                    ...prev,
                    [responseId]: { ...prev[responseId], error: null }
                }))
                await audioElement.play()
                setCurrentlyPlayingId(responseId)
            }
        } catch (error) {
            console.error('Audio playback error:', error)
            const errorMsg = 'Failed to play audio. The file may be corrupted or in an unsupported format.'
            setAudioStates(prev => ({
                ...prev,
                [responseId]: { ...prev[responseId], error: errorMsg }
            }))
            setCurrentlyPlayingId(null)
            toast.error('Failed to play audio recording')
        }
    }

    const handleTimeUpdate = (responseId: string) => (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget
        setAudioStates(prev => ({
            ...prev,
            [responseId]: { ...prev[responseId], currentTime: audio.currentTime }
        }))
    }

    const handleLoadedMetadata = (responseId: string) => (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget
        if (!isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioStates(prev => ({
                ...prev,
                [responseId]: { ...prev[responseId], duration: audio.duration, error: null }
            }))
        }
    }

    const handleSeek = (responseId: string) => (value: number[]) => {
        const audioElement = audioRefs.current[responseId]
        if (audioElement) {
            audioElement.currentTime = value[0]
            setAudioStates(prev => ({
                ...prev,
                [responseId]: { ...prev[responseId], currentTime: value[0] }
            }))
        }
    }

    const handleAudioEnded = (responseId: string) => () => {
        setCurrentlyPlayingId(null)
        setAudioStates(prev => ({
            ...prev,
            [responseId]: { ...prev[responseId], currentTime: 0 }
        }))
    }

    const handleAudioError = (responseId: string) => (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audio = e.currentTarget
        let errorMessage = 'Failed to load audio'

        if (audio.error) {
            // Only log errors that aren't MEDIA_ERR_SRC_NOT_SUPPORTED for the first source
            // (browser will try other sources automatically)
            if (audio.error.code !== MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                console.error('Audio element error:', audio.error)
            }

            switch (audio.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = t("applicants.audioAborted") || 'Audio loading was aborted'
                    break
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = t("applicants.audioNetworkError") || 'Network error while loading audio'
                    break
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = t("applicants.audioDecodeError") || 'Audio file is corrupted'
                    break
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    // Don't set error for format not supported - browser will try next source
                    return
                default:
                    errorMessage = t("applicants.audioError") || 'Unknown error loading audio'
            }
        }

        setAudioStates(prev => ({
            ...prev,
            [responseId]: { ...prev[responseId], error: errorMessage }
        }))
        if (currentlyPlayingId === responseId) {
            setCurrentlyPlayingId(null)
        }
        toast.error(errorMessage)
    }

    // Get avatar gradient
    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-400 to-rose-500",
        ]
        const index = name.charCodeAt(0) % gradients.length
        return gradients[index]
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                            {t("applicants.candidateDetails")}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                {t("applicants.contact")}
                            </Button>
                            <Button variant="default" size="sm" className="gap-2">
                                <CalendarPlus className="h-4 w-4" />
                                {t("applicants.scheduleInterview")}
                            </Button>
                        </div>
                    </div>

                    {/* Candidate Header Info */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className={cn(
                            "relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shrink-0",
                            getAvatarGradient(applicant.personalData?.name || "A")
                        )}>
                            {applicant.personalData?.name?.charAt(0)?.toUpperCase() || 'A'}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">
                                    {applicant.personalData?.name || 'Unknown'}
                                </h2>
                                {applicant.isSuspicious && (
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-primary font-medium">
                                    {applicant.jobId?.title || t("applicants.noJob")}
                                </span>
                                <span>•</span>
                                <span>{t("applicants.location")}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1">
                    <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none h-auto py-0">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
                        >
                            <User className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("applicants.overview")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="cv"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
                        >
                            <FileText className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("applicants.cv")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="voice"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
                        >
                            <Mic className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("applicants.voiceResponse")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="evaluation"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
                        >
                            <Sparkles className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("applicants.aiEvaluation")}
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {t("applicants.personalInfo")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {t("common.email")}
                                    </p>
                                    <p className="font-medium">{applicant.personalData?.email || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {t("applicants.phone")}
                                    </p>
                                    <p className="font-medium">{applicant.personalData?.phone || 'N/A'}</p>
                                </div>
                                {applicant.personalData?.age && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {t("applicants.age")}
                                        </p>
                                        <p className="font-medium">{applicant.personalData.age} {t("applicants.yearsOld")}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {t("applicants.location")}
                                    </p>
                                    <p className="font-medium">{t("applicants.locationValue")}</p>
                                </div>
                                {applicant.personalData?.yearsOfExperience !== undefined && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            {t("applicants.experience")}
                                        </p>
                                        <p className="font-medium">{applicant.personalData.yearsOfExperience} {t("applicants.years")}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {t("applicants.applicationDate")}
                                    </p>
                                    <p className="font-medium">{formatDate(applicant.submittedAt || applicant.createdAt)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* External Links */}
                        {(applicant.personalData?.linkedinUrl || applicant.cvUrl) && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        {t("applicants.externalLinks")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-3">
                                    {applicant.personalData?.linkedinUrl && (
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(applicant.personalData?.linkedinUrl, "_blank")}
                                            className="gap-2"
                                        >
                                            <Linkedin className="h-4 w-4 text-[#0077B5]" />
                                            LinkedIn Profile
                                        </Button>
                                    )}
                                    {applicant.cvUrl && (
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(applicant.cvUrl, "_blank")}
                                            className="gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {t("applicants.viewCV")}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* CV Tab */}
                    <TabsContent value="cv" className="p-6 mt-0">
                        {applicant.cvUrl ? (
                            <div className="space-y-4">
                                <div className="aspect-[3/4] w-full bg-muted rounded-lg border overflow-hidden">
                                    <iframe
                                        src={applicant.cvUrl}
                                        className="w-full h-full"
                                        title="CV Preview"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => window.open(applicant.cvUrl, "_blank")}
                                >
                                    <FileText className="h-4 w-4" />
                                    {t("applicants.downloadCV")}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <FileText className="h-12 w-12 mb-4 opacity-50" />
                                <p>{t("applicants.noCVUploaded")}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Voice Response Tab */}
                    <TabsContent value="voice" className="p-6 space-y-6 mt-0">
                        {voiceResponses.length > 0 ? (
                            voiceResponses.map((response, index) => {
                                const responseId = `${response.questionId}-${index}`
                                const audioState = audioStates[responseId] || { currentTime: 0, duration: 0, error: null }
                                const isThisPlaying = currentlyPlayingId === responseId
                                const displayDuration = response.audioDuration || audioState.duration || 0

                                return (
                                    <Card key={`voice-${responseId}`} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            {/* Audio Player */}
                                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        size="lg"
                                                        className="h-14 w-14 rounded-full"
                                                        onClick={() => togglePlay(responseId)}
                                                        disabled={!response.audioUrl || !!audioState.error}
                                                    >
                                                        {isThisPlaying ? (
                                                            <Pause className="h-6 w-6" />
                                                        ) : (
                                                            <Play className="h-6 w-6 ml-1" />
                                                        )}
                                                    </Button>

                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>{t("applicants.playRecording")}</span>
                                                            <span className="text-muted-foreground">
                                                                {formatTime(audioState.currentTime)} / {formatTime(displayDuration)}
                                                            </span>
                                                        </div>
                                                        <Slider
                                                            value={[audioState.currentTime]}
                                                            max={displayDuration || 100}
                                                            step={0.1}
                                                            onValueChange={handleSeek(responseId)}
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                                                </div>

                                                {response.audioUrl && (
                                                    <audio
                                                        ref={(el) => { audioRefs.current[responseId] = el }}
                                                        onTimeUpdate={handleTimeUpdate(responseId)}
                                                        onLoadedMetadata={handleLoadedMetadata(responseId)}
                                                        onEnded={handleAudioEnded(responseId)}
                                                        onError={handleAudioError(responseId)}
                                                        preload="metadata"
                                                        className="hidden"
                                                    >
                                                        {/* Multiple sources for browser compatibility */}
                                                        <source src={response.audioUrl} type="audio/webm" />
                                                        <source src={response.audioUrl} type="audio/ogg" />
                                                        <source src={response.audioUrl} type="audio/mp4" />
                                                        <source src={response.audioUrl} type="audio/mpeg" />
                                                    </audio>
                                                )}

                                                {audioState.error && (
                                                    <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {audioState.error}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Transcript */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant={transcriptView === 'clean' ? 'default' : 'ghost'}
                                                        size="sm"
                                                        onClick={() => setTranscriptView('clean')}
                                                    >
                                                        {t("applicants.cleanText")}
                                                    </Button>
                                                    <Button
                                                        variant={transcriptView === 'raw' ? 'default' : 'ghost'}
                                                        size="sm"
                                                        onClick={() => setTranscriptView('raw')}
                                                    >
                                                        {t("applicants.rawText")}
                                                    </Button>
                                                </div>

                                                <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                                                    {transcriptView === 'clean'
                                                        ? (response.cleanTranscript || t("applicants.noTranscript"))
                                                        : (response.rawTranscript || t("applicants.noTranscript"))
                                                    }
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Mic className="h-12 w-12 mb-4 opacity-50" />
                                <p>{t("applicants.noVoiceResponses")}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* AI Evaluation Tab */}
                    <TabsContent value="evaluation" className="p-6 space-y-8 mt-0">
                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-950/10 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                                        <div className="p-1.5 bg-emerald-500 dark:bg-emerald-600 rounded-md">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.strengths")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {getLocalizedArray(evaluation?.strengths).length > 0 ? (
                                        <div className="space-y-3">
                                            {getLocalizedArray(evaluation?.strengths).map((strength, index) => (
                                                <div
                                                    key={`strength-${index}`}
                                                    className={cn(
                                                        "group flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all",
                                                        locale === 'ar' && 'flex-row-reverse'
                                                    )}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm leading-relaxed text-emerald-900 dark:text-emerald-100 whitespace-pre-line flex-1",
                                                        locale === 'ar' && 'text-right'
                                                    )}>
                                                        {strength}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground py-4 text-center">{t("applicants.noStrengths")}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Weaknesses */}
                            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-950/10 border-2 border-red-300 dark:border-red-800 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-red-700 dark:text-red-400">
                                        <div className="p-1.5 bg-red-500 dark:bg-red-600 rounded-md">
                                            <AlertTriangle className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.weaknesses")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {getLocalizedArray(evaluation?.weaknesses).length > 0 ? (
                                        <div className="space-y-3">
                                            {getLocalizedArray(evaluation?.weaknesses).map((weakness, index) => (
                                                <div
                                                    key={`weakness-${index}`}
                                                    className={cn(
                                                        "group flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 hover:border-red-400 dark:hover:border-red-600 transition-all",
                                                        locale === 'ar' && 'flex-row-reverse'
                                                    )}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm leading-relaxed text-red-900 dark:text-red-100 whitespace-pre-line flex-1",
                                                        locale === 'ar' && 'text-right'
                                                    )}>
                                                        {weakness}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground py-4 text-center">{t("applicants.noWeaknesses")}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Missing Requirements */}
                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 border-2 border-amber-300 dark:border-amber-800 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
                                    <div className="p-1.5 bg-amber-500 dark:bg-amber-600 rounded-md">
                                        <XCircle className="h-5 w-5 text-white" />
                                    </div>
                                    {t("applicants.missingRequirements")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                {evaluation?.criteriaMatches?.filter(c => !c.matched).length ? (
                                    <div className="space-y-3">
                                        {evaluation.criteriaMatches
                                            .filter(c => !c.matched)
                                            .map((criteria, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50",
                                                        locale === 'ar' && 'flex-row-reverse'
                                                    )}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    </div>
                                                    <div className={cn("flex-1 space-y-1", locale === 'ar' && 'text-right')}>
                                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                            {criteria.criteriaName}
                                                        </p>
                                                        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                                                            {getLocalizedText(criteria.reason)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg">
                                        <CheckCircle className="h-6 w-6 shrink-0" />
                                        <span className="text-sm font-medium">{t("applicants.noMissingRequirements")}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Recommendation */}
                        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/30 dark:border-primary/20 shadow-md">
                            <CardHeader className="pb-4 border-b bg-primary/5">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                                    <div className="p-1.5 bg-primary rounded-md">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    {t("applicants.aiRecommendation")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                {/* Main Summary */}
                                <div className="p-4 bg-white dark:bg-primary/5 rounded-lg border border-primary/20">
                                    <p className={cn(
                                        "text-base leading-relaxed text-foreground whitespace-pre-line",
                                        locale === 'ar' && 'text-right'
                                    )}>
                                        {getLocalizedText(evaluation?.summary) || applicant.aiSummary || t("applicants.noAIRecommendation")}
                                    </p>
                                </div>

                                {/* Recommendation Reason */}
                                {getLocalizedText(evaluation?.recommendationReason) && (
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <p className={cn(
                                            "text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
                                            locale === 'ar' && 'text-right'
                                        )}>
                                            {getLocalizedText(evaluation?.recommendationReason)}
                                        </p>
                                    </div>
                                )}

                                {/* Suggested Interview Questions */}
                                {getLocalizedArray(evaluation?.suggestedQuestions).length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-border" />
                                            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                                                {t("applicants.suggestedQuestions")}
                                            </p>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        <div className="space-y-3">
                                            {getLocalizedArray(evaluation?.suggestedQuestions).map((q, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors",
                                                        locale === 'ar' && 'flex-row-reverse'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm leading-relaxed text-foreground whitespace-pre-line flex-1",
                                                        locale === 'ar' && 'text-right'
                                                    )}>
                                                        {q}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Voice Analysis Details */}
                        {evaluation?.voiceAnalysisDetails && evaluation.voiceAnalysisDetails.length > 0 && (
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-950/10 border-2 border-purple-300 dark:border-purple-800 shadow-sm">
                                <CardHeader className="pb-4 border-b border-purple-200 dark:border-purple-800">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-purple-700 dark:text-purple-400">
                                        <div className="p-1.5 bg-purple-500 dark:bg-purple-600 rounded-md">
                                            <Mic className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.voiceAnalysis")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {/* Overall Metrics */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {evaluation.sentimentScore !== undefined && (
                                            <div className="p-4 bg-white dark:bg-purple-950/20 rounded-lg border border-purple-200">
                                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                                                    {t("applicants.sentiment")}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "text-2xl font-bold",
                                                        evaluation.sentimentScore > 0.3 ? "text-emerald-600" :
                                                            evaluation.sentimentScore < -0.3 ? "text-red-600" :
                                                                "text-amber-600"
                                                    )}>
                                                        {evaluation.sentimentScore > 0.3 ? "😊" :
                                                            evaluation.sentimentScore < -0.3 ? "😞" : "😐"}
                                                    </div>
                                                    <span className="text-sm">
                                                        {(evaluation.sentimentScore * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {evaluation.confidenceScore !== undefined && (
                                            <div className="p-4 bg-white dark:bg-purple-950/20 rounded-lg border border-purple-200">
                                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                                                    {t("applicants.confidence")}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={evaluation.confidenceScore} className="flex-1" />
                                                    <span className="text-sm font-semibold">
                                                        {evaluation.confidenceScore.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Per-Question Details */}
                                    <div className="space-y-3">
                                        {evaluation.voiceAnalysisDetails.map((detail, idx) => (
                                            <div
                                                key={detail.questionId}
                                                className="p-4 bg-white dark:bg-purple-950/20 rounded-lg border border-purple-200"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                                        {t("applicants.question")} {idx + 1}
                                                    </p>
                                                    {detail.fluency && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {t("applicants.fluency")}: {detail.fluency.score}%
                                                        </Badge>
                                                    )}
                                                </div>

                                                {detail.keyPhrases && detail.keyPhrases.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {detail.keyPhrases.slice(0, 5).map((phrase, i) => (
                                                            <Badge
                                                                key={i}
                                                                variant="secondary"
                                                                className="bg-purple-100 text-purple-700 dark:bg-purple-900/50"
                                                            >
                                                                {phrase}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Social Profile Insights */}
                        {evaluation?.socialProfileInsights && (
                            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-950/10 border-2 border-cyan-300 dark:border-cyan-800 shadow-sm">
                                <CardHeader className="pb-4 border-b border-cyan-200 dark:border-cyan-800">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-cyan-700 dark:text-cyan-400">
                                        <div className="p-1.5 bg-cyan-500 dark:bg-cyan-600 rounded-md">
                                            <Globe className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.socialProfiles")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {/* LinkedIn */}
                                    {evaluation.socialProfileInsights.linkedin && (
                                        <div className="p-4 bg-white dark:bg-cyan-950/20 rounded-lg border border-cyan-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Linkedin className="h-5 w-5 text-[#0077B5]" />
                                                <p className="font-semibold text-cyan-900 dark:text-cyan-100">
                                                    LinkedIn
                                                </p>
                                            </div>
                                            {evaluation.socialProfileInsights.linkedin.highlights.length > 0 && (
                                                <ul className="space-y-2">
                                                    {evaluation.socialProfileInsights.linkedin.highlights.slice(0, 5).map((highlight, i) => (
                                                        <li key={i} className={cn(
                                                            "text-sm text-cyan-800 dark:text-cyan-200 flex items-start gap-2",
                                                            locale === 'ar' && 'text-right flex-row-reverse'
                                                        )}>
                                                            <CheckCircle className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                                                            <span>{highlight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* GitHub */}
                                    {evaluation.socialProfileInsights.github && (
                                        <div className="p-4 bg-white dark:bg-cyan-950/20 rounded-lg border border-cyan-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Star className="h-5 w-5 text-amber-500" />
                                                <p className="font-semibold text-cyan-900 dark:text-cyan-100">
                                                    GitHub
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">Repos</p>
                                                    <p className="text-lg font-bold">{evaluation.socialProfileInsights.github.repositories}</p>
                                                </div>
                                                <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">Stars</p>
                                                    <p className="text-lg font-bold">{evaluation.socialProfileInsights.github.stars}</p>
                                                </div>
                                                <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">Languages</p>
                                                    <p className="text-lg font-bold">{evaluation.socialProfileInsights.github.languages.length}</p>
                                                </div>
                                            </div>
                                            {evaluation.socialProfileInsights.github.highlights.length > 0 && (
                                                <ul className="space-y-2">
                                                    {evaluation.socialProfileInsights.github.highlights.slice(0, 3).map((highlight, i) => (
                                                        <li key={i} className={cn(
                                                            "text-sm text-cyan-800 dark:text-cyan-200 flex items-start gap-2",
                                                            locale === 'ar' && 'text-right flex-row-reverse'
                                                        )}>
                                                            <CheckCircle className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                                                            <span>{highlight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* Overall Highlights */}
                                    {evaluation.socialProfileInsights.overallHighlights.length > 0 && (
                                        <div className="p-4 bg-gradient-to-r from-cyan-100 to-purple-100 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-lg border border-cyan-300">
                                            <p className="font-semibold text-cyan-900 dark:text-cyan-100 mb-3">
                                                {t("applicants.topHighlights")}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {evaluation.socialProfileInsights.overallHighlights.slice(0, 8).map((highlight, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="secondary"
                                                        className="bg-white dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200"
                                                    >
                                                        ✨ {highlight}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Text Response Analysis */}
                        {evaluation?.textResponseAnalysis && (
                            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-950/10 border-2 border-indigo-300 dark:border-indigo-800 shadow-sm">
                                <CardHeader className="pb-4 border-b border-indigo-200 dark:border-indigo-800">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
                                        <div className="p-1.5 bg-indigo-500 dark:bg-indigo-600 rounded-md">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.writtenResponses")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {/* Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white dark:bg-indigo-950/20 rounded-lg border border-indigo-200">
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                                                {t("applicants.totalResponses")}
                                            </p>
                                            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                                                {evaluation.textResponseAnalysis.totalResponses}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-indigo-950/20 rounded-lg border border-indigo-200">
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                                                {t("applicants.overallQuality")}
                                            </p>
                                            <Badge className={cn(
                                                "text-sm",
                                                evaluation.textResponseAnalysis.overallQuality === 'excellent' ? 'bg-emerald-500' :
                                                    evaluation.textResponseAnalysis.overallQuality === 'good' ? 'bg-cyan-500' :
                                                        evaluation.textResponseAnalysis.overallQuality === 'average' ? 'bg-amber-500' :
                                                            'bg-red-500'
                                            )}>
                                                {evaluation.textResponseAnalysis.overallQuality.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Individual Responses */}
                                    <div className="space-y-3">
                                        {evaluation.textResponseAnalysis.responses.map((response) => (
                                            <div
                                                key={response.questionId}
                                                className="p-4 bg-white dark:bg-indigo-950/20 rounded-lg border border-indigo-200"
                                            >
                                                <div className={cn(
                                                    "flex items-start justify-between mb-2",
                                                    locale === 'ar' && 'flex-row-reverse'
                                                )}>
                                                    <p className={cn(
                                                        "text-sm font-medium text-indigo-900 dark:text-indigo-100",
                                                        locale === 'ar' && 'text-right'
                                                    )}>
                                                        {response.questionText}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                                        {response.wordCount} words
                                                    </Badge>
                                                </div>
                                                <p className={cn(
                                                    "text-sm text-indigo-700 dark:text-indigo-300 line-clamp-3 whitespace-pre-line",
                                                    locale === 'ar' && 'text-right'
                                                )}>
                                                    {response.answer}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* AI Analysis Breakdown - Transparency of AI Decisions */}
                        {evaluation?.aiAnalysisBreakdown && (
                            <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-950/10 border-2 border-violet-300 dark:border-violet-800 shadow-md">
                                <CardHeader className="pb-4 border-b border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-violet-700 dark:text-violet-400">
                                        <div className="p-1.5 bg-violet-500 dark:bg-violet-600 rounded-md">
                                            <Brain className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.aiTransparency")}
                                    </CardTitle>
                                    <p className="text-sm text-violet-600 dark:text-violet-400 mt-2">
                                        {t("applicants.aiTransparencyDesc")}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {/* 1. Screening Questions Analysis */}
                                    {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShieldAlert className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.screeningAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Total Questions</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.totalQuestions}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Knockout</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.knockoutQuestions}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Failed</p>
                                                    <p className="text-lg font-bold text-red-600">{evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length}</p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length > 0 && (
                                                <div className="space-y-2 mb-3">
                                                    {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.map((ko, idx) => (
                                                        <div key={idx} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg flex items-start gap-2">
                                                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-red-900 dark:text-red-100">{ko.question}</p>
                                                                <p className="text-xs text-red-700 dark:text-red-300">{ko.impact}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                <p className={cn("text-sm text-violet-800 dark:text-violet-200 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Voice Responses Analysis */}
                                    {evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Mic className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.voiceResponsesAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Responses</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.totalResponses}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Total Weight</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.totalWeight}/10</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-3">
                                                {evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.responses.map((resp, idx) => (
                                                    <div key={idx} className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">{resp.questionText}</p>
                                                            <Badge variant="outline" className="text-xs">Weight: {resp.weight}/10</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs mb-2">
                                                            <span className="text-violet-600">Sentiment: {resp.sentiment}</span>
                                                            <span className="text-violet-600">Confidence: {resp.confidence}%</span>
                                                            <span className="text-violet-600">Length: {resp.transcriptLength} chars</span>
                                                        </div>
                                                        <div className="p-2 bg-white dark:bg-violet-950/20 rounded">
                                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                            <p className={cn("text-xs text-violet-800 dark:text-violet-200", locale === 'ar' && 'text-right')}>
                                                                {getLocalizedText(resp.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">Overall Impact:</p>
                                                <p className={cn("text-sm text-violet-900 dark:text-violet-100 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallImpact)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Text Responses Analysis */}
                                    {evaluation.aiAnalysisBreakdown.textResponsesAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.textResponsesAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Responses</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.totalResponses}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Total Weight</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.totalWeight}/10</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-3">
                                                {evaluation.aiAnalysisBreakdown.textResponsesAnalysis.responses.map((resp, idx) => (
                                                    <div key={idx} className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">{resp.questionText}</p>
                                                            <Badge variant="outline" className="text-xs">Weight: {resp.weight}/10</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs mb-2">
                                                            <span className="text-violet-600">Quality: {resp.quality}</span>
                                                            <span className="text-violet-600">Words: {resp.wordCount}</span>
                                                        </div>
                                                        <div className="p-2 bg-white dark:bg-violet-950/20 rounded">
                                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                            <p className={cn("text-xs text-violet-800 dark:text-violet-200", locale === 'ar' && 'text-right')}>
                                                                {getLocalizedText(resp.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">Overall Impact:</p>
                                                <p className={cn("text-sm text-violet-900 dark:text-violet-100 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallImpact)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Additional Notes Analysis */}
                                    {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MessageSquare className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.additionalNotesAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Notes Provided</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesProvided ? 'Yes' : 'No'}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Length</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesLength} chars</p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.keyPointsExtracted.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2">Key Points Extracted:</p>
                                                    <ul className="space-y-1">
                                                        {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.keyPointsExtracted.map((point, idx) => (
                                                            <li key={idx} className="text-sm text-violet-800 dark:text-violet-200 flex items-start gap-2">
                                                                <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                <p className={cn("text-sm text-violet-800 dark:text-violet-200 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. External Profiles Analysis */}
                                    {evaluation.aiAnalysisBreakdown.externalProfilesAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Globe className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.externalProfilesAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">LinkedIn</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.linkedinAnalyzed ? '✓' : '✗'}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">GitHub</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.githubAnalyzed ? '✓' : '✗'}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Skills</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.skillsDiscovered}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Projects</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.projectsFound}</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                <p className={cn("text-sm text-violet-800 dark:text-violet-200 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Language Requirements Analysis */}
                                    {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Languages className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.languageRequirementsAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Total Languages</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.totalLanguages}</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Meets All</p>
                                                    <p className={cn("text-lg font-bold", evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.meetsAllRequirements ? 'text-emerald-600' : 'text-red-600')}>
                                                        {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.meetsAllRequirements ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.gaps.length > 0 && (
                                                <div className="space-y-2 mb-3">
                                                    {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.gaps.map((gap, idx) => (
                                                        <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
                                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{gap.language}</p>
                                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                                Has: {gap.candidate} | Needs: {gap.required} | Gap: {gap.gapLevel} level(s)
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                <p className={cn("text-sm text-violet-800 dark:text-violet-200 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 7. Experience Analysis */}
                                    {evaluation.aiAnalysisBreakdown.experienceAnalysis && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Briefcase className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.experienceAnalysis")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Self-Reported</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.experienceAnalysis.selfReported} yrs</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Required</p>
                                                    <p className="text-lg font-bold">{evaluation.aiAnalysisBreakdown.experienceAnalysis.required} yrs</p>
                                                </div>
                                                <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400">Meets?</p>
                                                    <p className={cn("text-lg font-bold", evaluation.aiAnalysisBreakdown.experienceAnalysis.meetsRequirement ? 'text-emerald-600' : 'text-red-600')}>
                                                        {evaluation.aiAnalysisBreakdown.experienceAnalysis.meetsRequirement ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.experienceAnalysis.gap && (
                                                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded text-center mb-3">
                                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                        Gap: {evaluation.aiAnalysisBreakdown.experienceAnalysis.gap} year(s) below minimum
                                                    </p>
                                                </div>
                                            )}
                                            <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                <p className={cn("text-sm text-violet-800 dark:text-violet-200 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.experienceAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 8. Scoring Breakdown */}
                                    {evaluation.aiAnalysisBreakdown.scoringBreakdown && (
                                        <div className="p-4 bg-white dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Target className="h-5 w-5 text-violet-600" />
                                                <p className="font-semibold text-violet-900 dark:text-violet-100">
                                                    {t("applicants.criteriaScoring")}
                                                </p>
                                            </div>
                                            <div className="space-y-3 mb-3">
                                                {evaluation.aiAnalysisBreakdown.scoringBreakdown.criteriaWeights.map((cw, idx) => (
                                                    <div key={idx} className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">{cw.criteriaName}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">Weight: {cw.weight}/10</Badge>
                                                                <Badge variant="outline" className="text-xs">Score: {cw.score}%</Badge>
                                                            </div>
                                                        </div>
                                                        <Progress value={cw.score} className="h-2 mb-2" />
                                                        <p className="text-xs text-violet-600 mb-2">Contribution to final score: {cw.contribution.toFixed(1)}</p>
                                                        <div className="p-2 bg-white dark:bg-violet-950/20 rounded">
                                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Reasoning:</p>
                                                            <p className={cn("text-xs text-violet-800 dark:text-violet-200", locale === 'ar' && 'text-right')}>
                                                                {getLocalizedText(cw.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg border border-violet-300">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="font-bold text-violet-900 dark:text-violet-100">Final Weighted Score</p>
                                                    <p className="text-2xl font-bold text-violet-600">{evaluation.aiAnalysisBreakdown.scoringBreakdown.totalWeightedScore.toFixed(1)}%</p>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-violet-950/20 rounded">
                                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">AI Summary:</p>
                                                    <p className={cn("text-sm text-violet-900 dark:text-violet-100 leading-relaxed", locale === 'ar' && 'text-right')}>
                                                        {getLocalizedText(evaluation.aiAnalysisBreakdown.scoringBreakdown.aiSummary)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* HR Requirements: Screening Questions & Language Proficiency */}
                        {(applicant.personalData.screeningAnswers || applicant.personalData.languageProficiency) && (
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-950/10 border-2 border-orange-300 dark:border-orange-800 shadow-sm">
                                <CardHeader className="pb-4 border-b border-orange-200 dark:border-orange-800">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-orange-700 dark:text-orange-400">
                                        <div className="p-1.5 bg-orange-500 dark:bg-orange-600 rounded-md">
                                            <ShieldAlert className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.hrRequirements")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {/* Screening Questions */}
                                    {applicant.personalData.screeningAnswers && Object.keys(applicant.personalData.screeningAnswers).length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShieldAlert className="h-4 w-4 text-orange-600" />
                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                    {t("applicants.screeningQuestions")}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {Object.entries(applicant.personalData.screeningAnswers).map(([question, answer], idx) => {
                                                    // Check if this is a knockout question
                                                    const jobQuestion = jobData?.screeningQuestions?.find(sq => sq.question === question)
                                                    const isKnockout = jobQuestion?.disqualify || false
                                                    const isFailed = isKnockout && !answer

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "p-3 rounded-lg border flex items-start gap-3",
                                                                isFailed
                                                                    ? "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-700"
                                                                    : answer
                                                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                                                        : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                                                                locale === 'ar' && 'flex-row-reverse'
                                                            )}
                                                        >
                                                            {isFailed ? (
                                                                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                                            ) : answer ? (
                                                                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className={cn(
                                                                        "text-sm font-medium flex-1",
                                                                        locale === 'ar' && 'text-right'
                                                                    )}>
                                                                        {question}
                                                                    </p>
                                                                    {isKnockout && (
                                                                        <Badge className={cn(
                                                                            "text-xs shrink-0",
                                                                            isFailed
                                                                                ? "bg-red-600 text-white"
                                                                                : "bg-orange-500 text-white"
                                                                        )}>
                                                                            {t("applicants.knockoutQuestion")}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className={cn(
                                                                    "text-xs mt-1",
                                                                    isFailed
                                                                        ? "text-red-800 dark:text-red-300 font-semibold"
                                                                        : answer
                                                                            ? "text-emerald-700 dark:text-emerald-300"
                                                                            : "text-red-700 dark:text-red-300",
                                                                    locale === 'ar' && 'text-right'
                                                                )}>
                                                                    {isFailed
                                                                        ? `❌ ${t("common.no")} - ${t("applicants.knockoutFailed")}`
                                                                        : answer
                                                                            ? `✅ ${t("common.yes")}`
                                                                            : `❌ ${t("common.no")}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Language Proficiency */}
                                    {applicant.personalData.languageProficiency && Object.keys(applicant.personalData.languageProficiency).length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Languages className="h-4 w-4 text-orange-600" />
                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                    {t("applicants.languageProficiency")}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(applicant.personalData.languageProficiency).map(([language, level], idx) => {
                                                    // Check if this language is required by the job
                                                    const jobLanguage = jobData?.languages?.find(l => l.language === language)
                                                    const requiredLevel = jobLanguage?.level || ''
                                                    const candidateLevel = (level as string).toLowerCase()
                                                    const requiredLevelLower = requiredLevel.toLowerCase()

                                                    // Compare levels
                                                    const levels = ['beginner', 'intermediate', 'advanced', 'native']
                                                    const candidateIdx = levels.indexOf(candidateLevel)
                                                    const requiredIdx = levels.indexOf(requiredLevelLower)
                                                    const meetsRequirement = requiredIdx === -1 || candidateIdx >= requiredIdx
                                                    const hasGap = requiredIdx !== -1 && candidateIdx < requiredIdx

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "p-3 rounded-lg border",
                                                                hasGap
                                                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                                                    : jobLanguage
                                                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                                                        : "bg-white dark:bg-orange-950/20 border-orange-200"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <p className={cn(
                                                                    "text-xs font-medium",
                                                                    hasGap
                                                                        ? "text-red-700 dark:text-red-300"
                                                                        : jobLanguage
                                                                            ? "text-emerald-700 dark:text-emerald-300"
                                                                            : "text-orange-600 dark:text-orange-400",
                                                                    locale === 'ar' && 'text-right'
                                                                )}>
                                                                    {language}
                                                                </p>
                                                                {hasGap && (
                                                                    <Badge className="bg-red-600 text-white text-xs shrink-0">
                                                                        {t("applicants.languageGap")}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Badge className={cn(
                                                                    "text-xs",
                                                                    hasGap
                                                                        ? "bg-red-500 text-white"
                                                                        : jobLanguage
                                                                            ? "bg-emerald-500 text-white"
                                                                            : "bg-orange-500 text-white"
                                                                )}>
                                                                    {candidateLevel.toUpperCase()}
                                                                </Badge>
                                                                {jobLanguage && (
                                                                    <p className={cn(
                                                                        "text-xs mt-1",
                                                                        hasGap
                                                                            ? "text-red-600 dark:text-red-400"
                                                                            : "text-emerald-600 dark:text-emerald-400",
                                                                        locale === 'ar' && 'text-right'
                                                                    )}>
                                                                        {hasGap
                                                                            ? `⚠️ ${t("applicants.required")}: ${requiredLevel.toUpperCase()}`
                                                                            : `✅ ${t("applicants.meetsRequirement")}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Notes */}
                                    {applicant.notes && applicant.notes.trim() !== '' && (
                                        <div className="space-y-2 pt-2 border-t border-orange-200">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-orange-600" />
                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                    {t("apply.additionalNotes")}
                                                </p>
                                            </div>
                                            <p className={cn(
                                                "text-sm text-orange-800 dark:text-orange-200 whitespace-pre-line p-3 bg-white dark:bg-orange-950/20 rounded-lg border border-orange-200",
                                                locale === 'ar' && 'text-right'
                                            )}>
                                                {applicant.notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Red Flags - Hidden from reviewers */}
                        {!isReviewer && (getLocalizedArray(evaluation?.redFlags).length > 0 || (applicant.aiRedFlags?.length ?? 0) > 0) && (
                            <Card className="bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950/40 dark:to-red-950/20 border-2 border-red-300 dark:border-red-700 shadow-md">
                                <CardHeader className="pb-4 border-b border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-red-600 dark:text-red-400">
                                        <div className="p-1.5 bg-red-500 dark:bg-red-600 rounded-md animate-pulse">
                                            <AlertTriangle className="h-5 w-5 text-white" />
                                        </div>
                                        {t("applicants.redFlags")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                    {(getLocalizedArray(evaluation?.redFlags).length > 0
                                        ? getLocalizedArray(evaluation?.redFlags)
                                        : (applicant.aiRedFlags || [])
                                    ).map((flag, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-red-950/30 border-l-4 border-red-500 dark:border-red-600 shadow-sm",
                                                locale === 'ar' && 'flex-row-reverse border-l-0 border-r-4'
                                            )}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                                            </div>
                                            <p className={cn(
                                                "text-sm leading-relaxed text-red-900 dark:text-red-200 whitespace-pre-line flex-1 font-medium",
                                                locale === 'ar' && 'text-right'
                                            )}>
                                                {flag}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Status Update */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{t("applicants.updateStatus")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={currentStatus}
                                    onValueChange={handleStatusChange}
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(statusColors).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                <span className="flex items-center gap-2">
                                                    <span className={cn("w-2 h-2 rounded-full", statusColors[status as ApplicantStatus].split(" ")[0])} />
                                                    {t(`applicants.status.${status}`)}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
