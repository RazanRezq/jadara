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
    Linkedin,
    Globe,
    AlertTriangle,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Sparkles,
    Mic,
    Play,
    Pause,
    Volume2,
    CalendarPlus,
    MessageSquare,
} from "lucide-react"
import type { Applicant, ApplicantStatus, EvaluationData } from "./applicants-client"

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
    const { t, isRTL } = useTranslate()
    const [updating, setUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<ApplicantStatus>(applicant.status)
    const [voiceResponses, setVoiceResponses] = useState<VoiceResponse[]>([])
    const [loadingResponses, setLoadingResponses] = useState(false)

    // Audio player states
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [transcriptView, setTranscriptView] = useState<'clean' | 'raw'>('clean')
    const [audioError, setAudioError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const isReviewer = userRole === "reviewer"
    const score = evaluation?.overallScore ?? applicant.aiScore

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

    // Audio controls
    const togglePlay = async () => {
        if (audioRef.current) {
            try {
                if (isPlaying) {
                    audioRef.current.pause()
                    setIsPlaying(false)
                } else {
                    setAudioError(null)
                    await audioRef.current.play()
                    setIsPlaying(true)
                }
            } catch (error) {
                console.error('Audio playback error:', error)
                setAudioError('Failed to play audio. The file may be corrupted or in an unsupported format.')
                setIsPlaying(false)
                toast.error('Failed to play audio recording')
            }
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration)
            setAudioError(null)
        }
    }

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
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
                    errorMessage = t("applicants.audioNotSupported") || 'Audio format not supported'
                    break
                default:
                    errorMessage = t("applicants.audioError") || 'Unknown error loading audio'
            }
        }

        setAudioError(errorMessage)
        setIsPlaying(false)

        // Only show toast for non-format errors (format errors are expected when trying multiple sources)
        if (!audio.error || audio.error.code !== MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            toast.error(errorMessage)
        }
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
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
                            voiceResponses.map((response, index) => (
                                <Card key={`voice-${response.questionId}-${index}`} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Audio Player */}
                                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    size="lg"
                                                    className="h-14 w-14 rounded-full"
                                                    onClick={togglePlay}
                                                    disabled={!response.audioUrl || !!audioError}
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="h-6 w-6" />
                                                    ) : (
                                                        <Play className="h-6 w-6 ml-1" />
                                                    )}
                                                </Button>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{t("applicants.playRecording")}</span>
                                                        <span className="text-muted-foreground">
                                                            {formatTime(currentTime)} / {formatTime(response.audioDuration || duration)}
                                                        </span>
                                                    </div>
                                                    <Slider
                                                        value={[currentTime]}
                                                        max={response.audioDuration || duration || 100}
                                                        step={0.1}
                                                        onValueChange={handleSeek}
                                                        className="w-full"
                                                    />
                                                </div>

                                                <Volume2 className="h-5 w-5 text-muted-foreground" />
                                            </div>

                                            {response.audioUrl && (
                                                <audio
                                                    ref={audioRef}
                                                    src={response.audioUrl}
                                                    onTimeUpdate={handleTimeUpdate}
                                                    onLoadedMetadata={handleLoadedMetadata}
                                                    onEnded={() => setIsPlaying(false)}
                                                    onError={handleAudioError}
                                                    preload="metadata"
                                                    crossOrigin="anonymous"
                                                />
                                            )}

                                            {audioError && (
                                                <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {audioError}
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
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Mic className="h-12 w-12 mb-4 opacity-50" />
                                <p>{t("applicants.noVoiceResponses")}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* AI Evaluation Tab */}
                    <TabsContent value="evaluation" className="p-6 space-y-6 mt-0">
                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Strengths */}
                            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                        <CheckCircle className="h-4 w-4" />
                                        {t("applicants.strengths")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {(evaluation?.strengths || []).length > 0 ? (
                                        evaluation?.strengths.map((strength, index) => (
                                            <Badge
                                                key={`strength-${index}`}
                                                variant="secondary"
                                                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mr-2 mb-2"
                                            >
                                                • {strength}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{t("applicants.noStrengths")}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Weaknesses */}
                            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        {t("applicants.weaknesses")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {(evaluation?.weaknesses || []).length > 0 ? (
                                        evaluation?.weaknesses.map((weakness, index) => (
                                            <Badge
                                                key={`weakness-${index}`}
                                                variant="secondary"
                                                className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 mr-2 mb-2"
                                            >
                                                • {weakness}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{t("applicants.noWeaknesses")}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Missing Requirements */}
                        <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <XCircle className="h-4 w-4" />
                                    {t("applicants.missingRequirements")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {evaluation?.criteriaMatches?.filter(c => !c.matched).length ? (
                                    <div className="space-y-2">
                                        {evaluation.criteriaMatches
                                            .filter(c => !c.matched)
                                            .map((criteria, index) => (
                                                <div key={index} className="text-sm">
                                                    • {criteria.criteriaName}: {criteria.reason}
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>{t("applicants.noMissingRequirements")}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Recommendation */}
                        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {t("applicants.aiRecommendation")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed">
                                    {evaluation?.summary || applicant.aiSummary || t("applicants.noAIRecommendation")}
                                </p>

                                {evaluation?.recommendationReason && (
                                    <p className="text-sm text-muted-foreground mt-3">
                                        {evaluation.recommendationReason}
                                    </p>
                                )}

                                {/* Suggested Interview Questions */}
                                {evaluation?.suggestedQuestions && evaluation.suggestedQuestions.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium mb-2">{t("applicants.suggestedQuestions")}</p>
                                        <ul className="space-y-1">
                                            {evaluation.suggestedQuestions.map((q, i) => (
                                                <li key={i} className="text-sm text-muted-foreground">• {q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Red Flags - Hidden from reviewers */}
                        {!isReviewer && ((evaluation?.redFlags || applicant.aiRedFlags)?.length ?? 0) > 0 && (
                            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        {t("applicants.redFlags")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {(evaluation?.redFlags || applicant.aiRedFlags || []).map((flag, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
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
