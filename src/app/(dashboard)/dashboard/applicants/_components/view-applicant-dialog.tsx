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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
    ChevronDown,
    Award,
    BarChart3,
    RefreshCw,
    Loader2,
} from "lucide-react"
import type { Applicant, ApplicantStatus, EvaluationData, BilingualText, BilingualTextArray } from "./applicants-client"
import { ScheduleInterviewDialog } from "./schedule-interview-dialog"
import { ManualReviewForm } from "./manual-review-form"
import { TeamNotes } from "./team-notes"
import { ReviewStats } from "./review-stats"

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
    initialTab?: string
    nextApplicantId?: string | null
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS COLORS - Based on the "Golden List" (5 statuses)
// ═══════════════════════════════════════════════════════════════════════════════
const statusColors: Record<ApplicantStatus, string> = {
    new: "bg-primary/10 text-primary dark:bg-primary/20",
    evaluated: "bg-primary/10 text-primary dark:bg-primary/20",
    interview: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

// ═══════════════════════════════════════════════════════════════════════════════
// DROPDOWN STATUSES - All 5 Golden List statuses visible in dropdown
// Pipeline: new → evaluated (via reviewer) → interview → hired/rejected
// ═══════════════════════════════════════════════════════════════════════════════
const VISIBLE_STATUSES: ApplicantStatus[] = [
    'new',        // جديد - Initial status (AI scored, pending review)
    'evaluated',  // تم التقييم - Reviewed by a team member
    'interview',  // مقابلة - In interview process
    'hired',      // تم التوظيف - Final positive outcome
    'rejected',   // مرفوض - Final negative outcome
]

export function ViewApplicantDialog({
    open,
    onOpenChange,
    applicant,
    evaluation,
    userRole,
    userId,
    onStatusChange,
    initialTab = "overview",
    nextApplicantId,
}: ViewApplicantDialogProps) {
    const { t, locale, dir } = useTranslate()
    const [activeTab, setActiveTab] = useState(initialTab)
    const [updating, setUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState<ApplicantStatus>(applicant.status)

    // Sync currentStatus when applicant prop changes
    useEffect(() => {
        setCurrentStatus(applicant.status)
    }, [applicant.status])

    // Reset active tab when initialTab changes (deep linking)
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab)
        }
    }, [initialTab])
    const [voiceResponses, setVoiceResponses] = useState<VoiceResponse[]>([])
    const [loadingResponses, setLoadingResponses] = useState(false)
    const [jobData, setJobData] = useState<{
        screeningQuestions?: Array<{ question: string; disqualify: boolean }>
        languages?: Array<{ language: string; level: string }>
    } | null>(null)
    const [showScheduleDialog, setShowScheduleDialog] = useState(false)
    const [isReEvaluating, setIsReEvaluating] = useState(false)

    // HOISTED DATA: Fetch reviews and comments at parent level to prevent tab flickering
    const [reviews, setReviews] = useState<any[]>([])
    const [reviewStats, setReviewStats] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [loadingReviews, setLoadingReviews] = useState(true)
    const [loadingComments, setLoadingComments] = useState(true)

    const isAdmin = userRole === 'admin' || userRole === 'superadmin'

    // Helper to get bilingual text based on current locale
    // Falls back to other language if preferred is empty
    const getLocalizedText = (text: BilingualText | string | undefined): string => {
        if (!text) return ''
        if (typeof text === 'string') return text // Legacy format
        const arText = text.ar || ''
        const enText = text.en || ''
        return locale === 'ar'
            ? (arText.length > 0 ? arText : enText)
            : (enText.length > 0 ? enText : arText)
    }

    // Helper to get bilingual array based on current locale
    // Falls back to other language if preferred array is empty
    const getLocalizedArray = (arr: BilingualTextArray | string[] | undefined): string[] => {
        if (!arr) return []
        if (Array.isArray(arr)) return arr // Legacy format
        const arArray = arr.ar || []
        const enArray = arr.en || []
        return locale === 'ar'
            ? (arArray.length > 0 ? arArray : enArray)
            : (enArray.length > 0 ? enArray : arArray)
    }

    // Alias for getLocalizedArray (used in enhanced AI evaluation display)
    const getLocalizedTextArray = getLocalizedArray

    // Helper to detect if text is primarily English (for fallback translation)
    const isEnglishText = (text: string): boolean => {
        // Check if text contains mostly English characters
        const englishChars = text.match(/[a-zA-Z]/g)?.length || 0
        const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0
        return englishChars > arabicChars
    }

    // Helper to translate red flags from English to Arabic
    const translateRedFlag = (flag: string): string => {
        if (locale !== 'ar') return flag // Only translate for Arabic
        if (!isEnglishText(flag)) return flag // Already in Arabic

        // Pattern matching for common red flag messages
        const patterns = [
            // Experience gap patterns (multiple formats)
            {
                pattern: /Experience gap[:\s]*(\d+)\s*years?\s*below\s*minimum\s*\((?:Has|has)\s*(\d+),?\s*(?:requires|needs)\s*(\d+)\)/i,
                replace: (match: RegExpMatchArray) => {
                    return t('applicants.redFlagPatterns.experienceGap')
                        .replace('{{gap}}', match[1])
                        .replace('{{has}}', match[2])
                        .replace('{{requires}}', match[3])
                }
            },
            {
                pattern: /Significant experience gap[:\s]*(\d+)\s*years?\s*(?:reported|actual)\s*(?:vs\.?|versus)\s*(\d+)\s*years?\s*(?:required|needed)/i,
                replace: (match: RegExpMatchArray) => {
                    return t('applicants.redFlagPatterns.significantExperienceGap')
                        .replace('{{reported}}', match[1])
                        .replace('{{required}}', match[2])
                }
            },
            // Screening question failures (multiple formats)
            {
                pattern: /Failed\s*(?:screening|knockout)\s*question[:\s]*(.+?)\s*\((?:NO|YES|No|Yes|no|yes)\)/i,
                replace: (match: RegExpMatchArray) => {
                    return t('applicants.redFlagPatterns.failedScreeningQuestion')
                        .replace('{{question}}', match[1].trim().replace(/[.،]+$/, ''))
                }
            },
            {
                pattern: /Screening\s*question\s*(?:failed|mismatch)[:\s]*(.+)/i,
                replace: (match: RegExpMatchArray) => {
                    return t('applicants.redFlagPatterns.failedScreeningQuestion')
                        .replace('{{question}}', match[1].trim().replace(/[.،]+$/, ''))
                }
            },
            // Generic patterns
            {
                pattern: /Minimum experience requirement not met/i,
                replace: () => t('applicants.redFlagPatterns.minExperienceNotMet')
            },
            {
                pattern: /Cannot start immediately/i,
                replace: () => t('applicants.redFlagPatterns.cannotStartImmediately')
            },
            {
                pattern: /Failed knockout question/i,
                replace: () => t('applicants.redFlagPatterns.knockoutQuestionFailed')
            },
            {
                pattern: /Language gap|Language proficiency.*(?:below|insufficient|not met)/i,
                replace: () => t('applicants.redFlagPatterns.languageGap')
            },
            {
                pattern: /Salary.*(?:mismatch|expectation|exceeds|outside|beyond)/i,
                replace: () => t('applicants.redFlagPatterns.salaryMismatch')
            },
            {
                pattern: /screening question mismatch/i,
                replace: () => t('applicants.redFlagPatterns.screeningMismatch')
            },
            {
                pattern: /Missing required skill[:\s]*(.+)/i,
                replace: (match: RegExpMatchArray) => {
                    return t('applicants.redFlagPatterns.missingRequiredSkill')
                        .replace('{{skill}}', match[1].trim().replace(/[.،]+$/, ''))
                }
            },
            {
                pattern: /No relevant experience/i,
                replace: () => t('applicants.redFlagPatterns.noRelevantExperience')
            },
            {
                pattern: /Location mismatch|Location.*(?:not suitable|incompatible)/i,
                replace: () => t('applicants.redFlagPatterns.locationMismatch')
            },
            {
                pattern: /Education requirement not met|Education.*(?:below|insufficient)/i,
                replace: () => t('applicants.redFlagPatterns.educationNotMet')
            },
            // Catch-all for "requirement not met" patterns
            {
                pattern: /(.+)\s*requirement\s*not\s*met/i,
                replace: (match: RegExpMatchArray) => {
                    const requirement = match[1].trim()
                    return `${requirement} - ${t('applicants.redFlagPatterns.minExperienceNotMet').replace('الخبرة الأدنى', 'المتطلب')}`
                }
            }
        ]

        for (const { pattern, replace } of patterns) {
            const match = flag.match(pattern)
            if (match) {
                return replace(match)
            }
        }

        return flag // Return original if no pattern matches
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

    // Fetch reviews and stats when dialog opens
    useEffect(() => {
        if (open && applicant.id) {
            fetchReviewsAndStats()
        }
    }, [open, applicant.id])

    const fetchReviewsAndStats = async () => {
        setLoadingReviews(true)
        try {
            const [statsRes, reviewsRes] = await Promise.all([
                fetch(`/api/reviews/average/${applicant.id}`),
                fetch(`/api/reviews/by-applicant/${applicant.id}`),
            ])

            const [statsData, reviewsData] = await Promise.all([
                statsRes.json(),
                reviewsRes.json(),
            ])

            if (statsData.success) setReviewStats(statsData.stats)
            if (reviewsData.success) setReviews(reviewsData.reviews)
        } catch (error) {
            console.error("Failed to fetch review data:", error)
        } finally {
            setLoadingReviews(false)
        }
    }

    // Fetch comments when dialog opens
    useEffect(() => {
        if (open && applicant.id) {
            fetchComments()
        }
    }, [open, applicant.id])

    const fetchComments = async () => {
        setLoadingComments(true)
        try {
            const response = await fetch(`/api/comments/by-applicant/${applicant.id}`)
            const data = await response.json()
            if (data.success) {
                setComments(data.comments)
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error)
        } finally {
            setLoadingComments(false)
        }
    }

    // Callback to refresh comments after posting/editing/deleting
    const handleCommentsChange = (updatedComments: any[]) => {
        setComments(updatedComments)
    }

    // Callback to refresh reviews after submitting a manual review
    const handleReviewSubmitted = () => {
        fetchReviewsAndStats()
        onStatusChange()
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

    const handleReEvaluate = async () => {
        setIsReEvaluating(true)
        try {
            const response = await fetch(`/api/evaluations/re-evaluate/${applicant.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })

            const data = await response.json()

            if (data.success) {
                toast.success(locale === 'ar' ? 'تم إعادة التقييم بنجاح' : 'Re-evaluation completed successfully')
                // Refresh the page to show updated data
                onStatusChange()
            } else {
                // Better error messaging for quota issues
                const errorMsg = data.error || ''
                const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('429') || data.details?.includes('quota')

                if (isQuotaError) {
                    toast.error(
                        locale === 'ar'
                            ? 'تم تجاوز حد استخدام الذكاء الاصطناعي. يرجى المحاولة لاحقًا أو التحقق من خطة الفوترة الخاصة بك.'
                            : 'AI quota exceeded. Please try again later or check your billing plan.',
                        { duration: 5000 }
                    )
                } else {
                    toast.error(data.error || (locale === 'ar' ? 'فشل إعادة التقييم' : 'Re-evaluation failed'))
                }

                // Show details in console for debugging
                if (data.details) {
                    console.error('Re-evaluation error details:', data.details)
                }
            }
        } catch (error) {
            console.error("Re-evaluate error:", error)
            toast.error(
                locale === 'ar'
                    ? 'حدث خطأ أثناء إعادة التقييم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.'
                    : 'An error occurred during re-evaluation. Please check your internet connection and try again.',
                { duration: 5000 }
            )
        } finally {
            setIsReEvaluating(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return new Date(dateString).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US", {
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
        if (score >= 75) return "text-primary"
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
            "from-gray-200 to-gray-100",
            "from-pink-400 to-rose-500",
        ]
        const index = name.charCodeAt(0) % gradients.length
        return gradients[index]
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir={dir} className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 text-start">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                            {t("applicants.candidateDetails")}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {/* Status Dropdown - Visible in header */}
                            <Select
                                value={currentStatus}
                                onValueChange={handleStatusChange}
                                disabled={updating}
                            >
                                <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* CLEAN UI: Only show user-facing statuses, hide internal ones */}
                                    {VISIBLE_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            <span className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", statusColors[status].split(" ")[0])} />
                                                {t(`applicants.status.${status}`)}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Separator orientation="vertical" className="h-6" />

                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => window.open(`mailto:${applicant.personalData?.email}`, '_blank')}
                            >
                                <MessageSquare className="h-4 w-4" />
                                {t("applicants.contact")}
                            </Button>
                            {isAdmin && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setShowScheduleDialog(true)}
                                >
                                    <CalendarPlus className="h-4 w-4" />
                                    {t("applicants.scheduleInterview")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Candidate Header Info */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className={cn(
                            "relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shrink-0",
                            getAvatarGradient(applicant.displayName || applicant.personalData?.name || "A")
                        )}>
                            {(applicant.displayName || applicant.personalData?.name)?.charAt(0)?.toUpperCase() || 'A'}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">
                                    {applicant.displayName || applicant.personalData?.name || 'Unnamed Candidate'}
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 -mt-4" dir={dir}>
                    <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none h-auto py-0">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <User className="h-4 w-4 me-2" />
                            {t("applicants.overview")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="cv"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <FileText className="h-4 w-4 me-2" />
                            {t("applicants.cv")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="voice"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <Mic className="h-4 w-4 me-2" />
                            {t("applicants.voiceResponse")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="evaluation"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <Sparkles className="h-4 w-4 me-2" />
                            {t("applicants.aiEvaluation")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="review"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <Star className="h-4 w-4 me-2" />
                            {t("applicants.teamReview")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <MessageSquare className="h-4 w-4 me-2" />
                            {t("applicants.teamNotes")}
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="p-4 sm:p-6 space-y-6 mt-0">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {t("applicants.personalInfo")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                {applicant.personalData?.location && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {t("applicants.location")}
                                        </p>
                                        <p className="font-medium">{applicant.personalData.location}</p>
                                    </div>
                                )}
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

                        {/* External Links - Enhanced LinkedIn Review */}
                        {(applicant.personalData?.linkedinUrl || applicant.cvUrl) && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        {t("applicants.externalLinks")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-3">
                                        {applicant.personalData?.linkedinUrl && (
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(applicant.personalData?.linkedinUrl, "_blank")}
                                                className="gap-2 bg-[#0077B5]/5 hover:bg-[#0077B5]/10 border-[#0077B5]/20 hover:border-[#0077B5]/40"
                                            >
                                                <Linkedin className="h-4 w-4 text-[#0077B5]" />
                                                {t("applicants.openLinkedIn")}
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
                                    </div>

                                    {/* LinkedIn Review Notes - Only show if LinkedIn URL exists */}
                                    {applicant.personalData?.linkedinUrl && (
                                        <div className="pt-2 border-t">
                                            <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                {t("applicants.linkedinReviewNotes")}
                                            </label>
                                            <textarea
                                                placeholder={t("applicants.linkedinReviewNotesPlaceholder")}
                                                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                defaultValue=""
                                            />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                💡 {t("applicants.linkedinReviewNotesHint")}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* CV Tab */}
                    <TabsContent value="cv" className="p-4 sm:p-6 mt-0">
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
                    <TabsContent value="voice" className="p-4 sm:p-6 space-y-6 mt-0">
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
                                                            <Play className="h-6 w-6 ms-1" />
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
                    <TabsContent value="evaluation" className="p-4 sm:p-6 space-y-6 mt-0">
                        {/* ═══════════════════════════════════════════════════════════════════════════════
                            AI SUMMARY CARD - Quick overview with score, recommendation, and key insights
                        ═══════════════════════════════════════════════════════════════════════════════ */}
                        <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/50 dark:via-slate-900/30 dark:to-slate-950/50 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Score Gauge */}
                                    <div className="flex flex-col items-center justify-center lg:border-e lg:border-slate-200 dark:lg:border-slate-700 lg:pe-6">
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    className="text-slate-200 dark:text-slate-700"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(evaluation?.overallScore || applicant.aiScore || 0) * 2.64} 264`}
                                                    className={cn(
                                                        (evaluation?.overallScore || applicant.aiScore || 0) >= 80 ? "text-emerald-500" :
                                                        (evaluation?.overallScore || applicant.aiScore || 0) >= 60 ? "text-amber-500" : "text-red-500"
                                                    )}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={cn(
                                                    "text-3xl font-bold",
                                                    (evaluation?.overallScore || applicant.aiScore || 0) >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                                                    (evaluation?.overallScore || applicant.aiScore || 0) >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                                                )}>
                                                    {evaluation?.overallScore || applicant.aiScore || 0}%
                                                </span>
                                                <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'التوافق' : 'Match'}</span>
                                            </div>
                                        </div>
                                        {/* Recommendation Badge */}
                                        <Badge className={cn(
                                            "mt-3 text-sm px-4 py-1",
                                            evaluation?.recommendation === 'hire' ? "bg-emerald-500 hover:bg-emerald-600" :
                                            evaluation?.recommendation === 'hold' ? "bg-amber-500 hover:bg-amber-600" :
                                            "bg-red-500 hover:bg-red-600"
                                        )}>
                                            <Award className="h-4 w-4 me-1.5" />
                                            {evaluation?.recommendation === 'hire' ? (locale === 'ar' ? 'توظيف' : 'Hire') :
                                             evaluation?.recommendation === 'hold' ? (locale === 'ar' ? 'انتظار' : 'Hold') :
                                             (locale === 'ar' ? 'رفض' : 'Reject')}
                                        </Badge>
                                    </div>

                                    {/* Summary & Key Insights */}
                                    <div className="flex-1 space-y-4">
                                        {/* AI Summary */}
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                                <Brain className="h-4 w-4" />
                                                {locale === 'ar' ? 'ملخص الذكاء الاصطناعي' : 'AI Summary'}
                                            </p>
                                            <p className="text-sm text-foreground leading-relaxed text-start" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                                {getLocalizedText(evaluation?.summary) || applicant.aiSummary || (locale === 'ar' ? 'لا يوجد ملخص متاح' : 'No summary available')}
                                            </p>
                                        </div>

                                        {/* Quick Stats Row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {/* Strengths Count */}
                                            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{locale === 'ar' ? 'نقاط القوة' : 'Strengths'}</p>
                                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                    {getLocalizedArray(evaluation?.strengths).length}
                                                </p>
                                            </div>
                                            {/* Weaknesses Count */}
                                            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                <p className="text-xs text-amber-600 dark:text-amber-400">{locale === 'ar' ? 'نقاط الضعف' : 'Weaknesses'}</p>
                                                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                                    {getLocalizedArray(evaluation?.weaknesses).length}
                                                </p>
                                            </div>
                                            {/* Red Flags Count */}
                                            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <p className="text-xs text-red-600 dark:text-red-400">{locale === 'ar' ? 'تنبيهات' : 'Red Flags'}</p>
                                                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                                    {getLocalizedArray(evaluation?.redFlags).length}
                                                </p>
                                            </div>
                                            {/* Criteria Matched */}
                                            <div className="text-center p-2 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                                                <p className="text-xs text-primary">{locale === 'ar' ? 'المعايير' : 'Criteria Met'}</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {evaluation?.criteriaMatches?.filter(c => c.matched).length || 0}/{evaluation?.criteriaMatches?.length || 0}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Top Strengths (max 3) */}
                                        {getLocalizedArray(evaluation?.strengths).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    {locale === 'ar' ? 'أبرز نقاط القوة' : 'Top Strengths'}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                                    {getLocalizedArray(evaluation?.strengths).slice(0, 3).map((s, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-xs">
                                                            {s.length > 50 ? s.slice(0, 50) + '...' : s}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Red Flags (if any) */}
                                        {!isReviewer && getLocalizedArray(evaluation?.redFlags).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    {locale === 'ar' ? 'تنبيهات هامة' : 'Red Flags'}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                                                    {getLocalizedArray(evaluation?.redFlags).slice(0, 2).map((f, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs">
                                                            {f.length > 50 ? f.slice(0, 50) + '...' : f}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Re-evaluate Button - Show if evaluation failed or incomplete */}
                        {(!evaluation || !evaluation.aiAnalysisBreakdown) && (
                            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <p className="font-semibold text-amber-900 dark:text-amber-100">
                                                {locale === 'ar' ? 'التقييم الذكي غير متوفر' : 'AI Evaluation Unavailable'}
                                            </p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                {locale === 'ar' ? 'يمكنك إعادة تشغيل التقييم الذكي للحصول على تحليل شامل' : 'Re-run AI evaluation to get comprehensive analysis'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleReEvaluate}
                                        disabled={isReEvaluating}
                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        {isReEvaluating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                                {locale === 'ar' ? 'جارٍ إعادة التقييم...' : 'Re-evaluating...'}
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 me-2" />
                                                {locale === 'ar' ? 'إعادة التقييم' : 'Re-evaluate'}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* ═══════════════════════════════════════════════════════════════════════════════
                            COLLAPSIBLE AI TRANSPARENCY SECTIONS
                        ═══════════════════════════════════════════════════════════════════════════════ */}
                        {/* AI Analysis Breakdown - Collapsible Transparency Sections */}
                        {evaluation?.aiAnalysisBreakdown && (
                            <div className="space-y-3">
                                {/* Section Header */}
                                <div className="flex items-center gap-2 px-1 mb-4">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <h3 className="text-base font-semibold text-foreground">
                                        {t("applicants.aiTransparency")}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {locale === 'ar' ? '(انقر للتوسيع)' : '(click to expand)'}
                                    </span>
                                </div>

                                {/* 1. Screening Questions Analysis - Collapsible */}
                                {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis && (
                                    <Collapsible>
                                        <CollapsibleTrigger className="w-full">
                                            <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-muted rounded-md">
                                                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-start">
                                                        <p className="font-medium text-foreground text-sm">{t("applicants.screeningAnalysis")}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.totalQuestions} {locale === 'ar' ? 'أسئلة' : 'questions'}
                                                            {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length === 0 && (
                                                                <span className="text-emerald-600 dark:text-emerald-400 ms-2">✓ {locale === 'ar' ? 'اجتاز الكل' : 'All passed'}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">{locale === 'ar' ? 'إجمالي' : 'Total'}</p>
                                                        <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.totalQuestions}</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">{locale === 'ar' ? 'حاسمة' : 'Knockout'}</p>
                                                        <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.knockoutQuestions}</p>
                                                    </div>
                                                    <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">{locale === 'ar' ? 'فشل' : 'Failed'}</p>
                                                        <p className={cn("text-xl font-semibold", evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                                            {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'الأسئلة الفاشلة:' : 'Failed Questions:'}</p>
                                                        {evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.failedKnockouts.map((ko, idx) => (
                                                            <div key={idx} className="p-3 bg-card rounded-lg border border-red-200 dark:border-red-900 flex items-start gap-2">
                                                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-foreground">{ko.question}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">{ko.impact}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">{locale === 'ar' ? 'تحليل الذكاء الاصطناعي' : 'AI Reasoning'}</p>
                                                    <p className="text-sm text-foreground leading-relaxed text-start">
                                                        {getLocalizedText(evaluation.aiAnalysisBreakdown.screeningQuestionsAnalysis.aiReasoning)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                    {/* 2. Voice Responses Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer text-start">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-muted rounded-md">
                                                                <Mic className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground text-sm">{t("applicants.voiceResponsesAnalysis")}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.totalResponses} {locale === 'ar' ? 'إجابات' : 'responses'} •
                                                                    {locale === 'ar' ? ' ملاءمة: ' : ' Avg Relevance: '}{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageRelevanceScore || 0}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180 shrink-0" />
                                                    </div>
                                                    {/* Show top 2 strengths in collapsed state */}
                                                    {(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 && (
                                                        <div className="ms-11 mt-2">
                                                            <p className="text-[10px] font-medium text-muted-foreground mb-1">{locale === 'ar' ? 'نقاط القوة:' : 'Top Strengths:'}</p>
                                                            <div className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallStrengths) || []).slice(0, 2).map((s: string, i: number) => (
                                                                    <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                                                                        <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                                        <span className="line-clamp-1">{s}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            {/* Summary Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.responses")}</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.totalResponses}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.totalWeight")}</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.totalWeight}/10</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.avgRelevance")}</p>
                                                    <p className={cn("text-xl font-semibold",
                                                        (evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageRelevanceScore || 0) >= 70 ? 'text-emerald-600' :
                                                        (evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageRelevanceScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                    )}>{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageRelevanceScore || 0}%</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.avgCommunication")}</p>
                                                    <p className={cn("text-xl font-semibold",
                                                        (evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageCommunicationScore || 0) >= 70 ? 'text-blue-600' :
                                                        (evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageCommunicationScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                    )}>{evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.averageCommunicationScore || 0}%</p>
                                                </div>
                                            </div>

                                            {/* Overall Strengths & Weaknesses */}
                                            {((evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 ||
                                              (evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallWeaknesses?.en?.length || 0) > 0) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 && (
                                                        <div className="p-3 bg-card rounded-lg border border-border">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("applicants.overallStrengths")}</p>
                                                            <ul className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallStrengths) || []).map((s: string, i: number) => (
                                                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                                                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                                                        <span>{s}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallWeaknesses?.en?.length || 0) > 0 && (
                                                        <div className="p-3 bg-card rounded-lg border border-border">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("applicants.areasForImprovement")}</p>
                                                            <ul className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallWeaknesses) || []).map((w: string, i: number) => (
                                                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                                                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                                                        <span>{w}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Individual Response Details */}
                                            <div className="space-y-3 mb-3">
                                                {evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.responses.map((resp, idx) => (
                                                    <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <p className="text-sm font-medium text-foreground flex-1">{resp.questionText}</p>
                                                            <Badge variant="outline" className="text-xs ms-2 shrink-0">Weight: {resp.weight}/10</Badge>
                                                        </div>

                                                        {/* Scores Row */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.relevance")}</p>
                                                                <p className={cn("text-sm font-semibold",
                                                                    (resp.relevanceScore || 0) >= 70 ? 'text-emerald-600' :
                                                                    (resp.relevanceScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                                )}>{resp.relevanceScore || 0}%</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.communication")}</p>
                                                                <p className={cn("text-sm font-semibold",
                                                                    (resp.communicationScore || 0) >= 70 ? 'text-blue-600' :
                                                                    (resp.communicationScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                                )}>{resp.communicationScore || 0}%</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.sentiment")}</p>
                                                                <p className="text-sm font-medium capitalize text-foreground">{resp.sentiment}</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.confidence")}</p>
                                                                <p className="text-sm font-medium text-foreground">{resp.confidence}%</p>
                                                            </div>
                                                        </div>

                                                        {/* Key Points Mentioned */}
                                                        {(resp.keyPointsMentioned?.en?.length || 0) > 0 && (
                                                            <div className="mb-3">
                                                                <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.keyPointsMentioned")}:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(getLocalizedTextArray(resp.keyPointsMentioned) || []).map((point: string, i: number) => (
                                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-primary/10 text-primary">{point}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Strengths & Areas for Improvement */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                            {(resp.strengthsInResponse?.en?.length || 0) > 0 && (
                                                                <div className="p-2 bg-card rounded-md border border-border">
                                                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.strengths")}:</p>
                                                                    <ul className="space-y-0.5">
                                                                        {(getLocalizedTextArray(resp.strengthsInResponse) || []).map((s: string, i: number) => (
                                                                            <li key={i} className="text-[10px] text-foreground">• {s}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {(resp.areasForImprovement?.en?.length || 0) > 0 && (
                                                                <div className="p-2 bg-card rounded-md border border-border">
                                                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.improvement")}:</p>
                                                                    <ul className="space-y-0.5">
                                                                        {(getLocalizedTextArray(resp.areasForImprovement) || []).map((w: string, i: number) => (
                                                                            <li key={i} className="text-[10px] text-foreground">• {w}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Red Flags */}
                                                        {(resp.redFlagsInResponse?.en?.length || 0) > 0 && (
                                                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded mb-3 border border-red-200 dark:border-red-800">
                                                                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1">{t("applicants.redFlags")}:</p>
                                                                <ul className="space-y-0.5">
                                                                    {(getLocalizedTextArray(resp.redFlagsInResponse) || []).map((rf: string, i: number) => (
                                                                        <li key={i} className="text-[10px] text-red-700 dark:text-red-300 flex items-start gap-1">
                                                                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                                                            <span>{rf}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Specific Feedback */}
                                                        <div className="p-2 bg-card rounded-md border border-border">
                                                            <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.aiFeedback")}:</p>
                                                            <p className="text-xs text-foreground text-start leading-relaxed">
                                                                {getLocalizedText(resp.specificFeedback) || getLocalizedText(resp.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Overall Impact */}
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">{t("applicants.overallImpact")}:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.voiceResponsesAnalysis.overallImpact)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 3. Text Responses Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.textResponsesAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer text-start">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-muted rounded-md">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground text-sm">{t("applicants.textResponsesAnalysis")}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {evaluation.aiAnalysisBreakdown.textResponsesAnalysis.totalResponses} {locale === 'ar' ? 'إجابات' : 'responses'} •
                                                                    {locale === 'ar' ? ' جودة: ' : ' Quality: '}{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageContentQuality || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180 shrink-0" />
                                                    </div>
                                                    {/* Show top 2 strengths in collapsed state */}
                                                    {(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 && (
                                                        <div className="ms-11 mt-2">
                                                            <p className="text-[10px] font-medium text-muted-foreground mb-1">{locale === 'ar' ? 'نقاط القوة:' : 'Top Strengths:'}</p>
                                                            <div className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallStrengths) || []).slice(0, 2).map((s: string, i: number) => (
                                                                    <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                                                                        <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                                        <span className="line-clamp-1">{s}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            {/* Summary Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.responses")}</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.totalResponses}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.totalWeight")}</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.totalWeight}/10</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.avgRelevance")}</p>
                                                    <p className={cn("text-xl font-semibold",
                                                        (evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageRelevanceScore || 0) >= 70 ? 'text-emerald-600' :
                                                        (evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageRelevanceScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                    )}>{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageRelevanceScore || 0}%</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">{t("applicants.contentQuality")}</p>
                                                    <p className={cn("text-xl font-semibold capitalize",
                                                        evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageContentQuality === 'excellent' ? 'text-emerald-600' :
                                                        evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageContentQuality === 'good' ? 'text-blue-600' :
                                                        evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageContentQuality === 'average' ? 'text-amber-600' : 'text-red-600'
                                                    )}>{evaluation.aiAnalysisBreakdown.textResponsesAnalysis.averageContentQuality || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Overall Strengths & Weaknesses */}
                                            {((evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 ||
                                              (evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallWeaknesses?.en?.length || 0) > 0) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallStrengths?.en?.length || 0) > 0 && (
                                                        <div className="p-3 bg-card rounded-lg border border-border">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("applicants.overallStrengths")}</p>
                                                            <ul className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallStrengths) || []).map((s: string, i: number) => (
                                                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                                                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                                                        <span>{s}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallWeaknesses?.en?.length || 0) > 0 && (
                                                        <div className="p-3 bg-card rounded-lg border border-border">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("applicants.areasForImprovement")}</p>
                                                            <ul className="space-y-1">
                                                                {(getLocalizedTextArray(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallWeaknesses) || []).map((w: string, i: number) => (
                                                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                                                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                                                        <span>{w}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Individual Response Details */}
                                            <div className="space-y-3 mb-3">
                                                {evaluation.aiAnalysisBreakdown.textResponsesAnalysis.responses.map((resp, idx) => (
                                                    <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <p className="text-sm font-medium text-foreground flex-1">{resp.questionText}</p>
                                                            <Badge variant="outline" className="text-xs ms-2 shrink-0">Weight: {resp.weight}/10</Badge>
                                                        </div>

                                                        {/* Scores Row */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.relevance")}</p>
                                                                <p className={cn("text-sm font-semibold",
                                                                    (resp.relevanceScore || 0) >= 70 ? 'text-emerald-600' :
                                                                    (resp.relevanceScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                                )}>{resp.relevanceScore || 0}%</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.writingQuality")}</p>
                                                                <p className={cn("text-sm font-semibold",
                                                                    (resp.communicationScore || 0) >= 70 ? 'text-blue-600' :
                                                                    (resp.communicationScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                                                )}>{resp.communicationScore || 0}%</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.quality")}</p>
                                                                <p className={cn("text-sm font-medium capitalize text-foreground",
                                                                    resp.quality === 'excellent' ? 'text-emerald-600' :
                                                                    resp.quality === 'good' ? 'text-blue-600' :
                                                                    resp.quality === 'average' ? 'text-amber-600' : 'text-red-600'
                                                                )}>{resp.quality}</p>
                                                            </div>
                                                            <div className="text-center p-2 bg-card rounded-md border border-border">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">{t("applicants.wordCount")}</p>
                                                                <p className="text-sm font-medium text-foreground">{resp.wordCount}</p>
                                                            </div>
                                                        </div>

                                                        {/* Key Points Mentioned */}
                                                        {(resp.keyPointsMentioned?.en?.length || 0) > 0 && (
                                                            <div className="mb-3">
                                                                <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.keyPointsMentioned")}:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(getLocalizedTextArray(resp.keyPointsMentioned) || []).map((point: string, i: number) => (
                                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-primary/10 text-primary">{point}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Strengths & Areas for Improvement */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                            {(resp.strengthsInResponse?.en?.length || 0) > 0 && (
                                                                <div className="p-2 bg-card rounded-md border border-border">
                                                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.strengths")}:</p>
                                                                    <ul className="space-y-0.5">
                                                                        {(getLocalizedTextArray(resp.strengthsInResponse) || []).map((s: string, i: number) => (
                                                                            <li key={i} className="text-[10px] text-foreground">• {s}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {(resp.areasForImprovement?.en?.length || 0) > 0 && (
                                                                <div className="p-2 bg-card rounded-md border border-border">
                                                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.improvement")}:</p>
                                                                    <ul className="space-y-0.5">
                                                                        {(getLocalizedTextArray(resp.areasForImprovement) || []).map((w: string, i: number) => (
                                                                            <li key={i} className="text-[10px] text-foreground">• {w}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Red Flags */}
                                                        {(resp.redFlagsInResponse?.en?.length || 0) > 0 && (
                                                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded mb-3 border border-red-200 dark:border-red-800">
                                                                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1">{t("applicants.redFlags")}:</p>
                                                                <ul className="space-y-0.5">
                                                                    {(getLocalizedTextArray(resp.redFlagsInResponse) || []).map((rf: string, i: number) => (
                                                                        <li key={i} className="text-[10px] text-red-700 dark:text-red-300 flex items-start gap-1">
                                                                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                                                            <span>{rf}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Specific Feedback */}
                                                        <div className="p-2 bg-card rounded-md border border-border">
                                                            <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("applicants.aiFeedback")}:</p>
                                                            <p className="text-xs text-foreground text-start leading-relaxed">
                                                                {getLocalizedText(resp.specificFeedback) || getLocalizedText(resp.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Overall Impact */}
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">{t("applicants.overallImpact")}:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.textResponsesAnalysis.overallImpact)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 4. Additional Notes Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-start">
                                                            <p className="font-medium text-foreground text-sm">{t("applicants.additionalNotesAnalysis")}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesProvided ? (locale === 'ar' ? 'متوفرة' : 'Provided') : (locale === 'ar' ? 'غير متوفرة' : 'Not provided')} •
                                                                {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesLength} {locale === 'ar' ? 'حرف' : 'chars'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Notes Provided</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesProvided ? 'Yes' : 'No'}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Length</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.notesLength} chars</p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.keyPointsExtracted.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Key Points Extracted:</p>
                                                    <ul className="space-y-1">
                                                        {evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.keyPointsExtracted.map((point, idx) => (
                                                            <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                                                                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">AI Reasoning:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.additionalNotesAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 5. External Profiles Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.externalProfilesAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-start">
                                                            <p className="font-medium text-foreground text-sm">{t("applicants.externalProfilesAnalysis")}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.skillsDiscovered} {locale === 'ar' ? 'مهارات' : 'skills'} •
                                                                {evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.projectsFound} {locale === 'ar' ? 'مشاريع' : 'projects'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.linkedinAnalyzed ? '✓' : '✗'}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">GitHub</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.githubAnalyzed ? '✓' : '✗'}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Skills</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.skillsDiscovered}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Projects</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.projectsFound}</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">AI Reasoning:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.externalProfilesAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 6. Language Requirements Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <Languages className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-start">
                                                            <p className="font-medium text-foreground text-sm">{t("applicants.languageRequirementsAnalysis")}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.totalLanguages} {locale === 'ar' ? 'لغات' : 'languages'} •
                                                                {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.meetsAllRequirements ?
                                                                    <span className="text-emerald-600 dark:text-emerald-400"> {locale === 'ar' ? 'يستوفي الكل' : 'Meets all'}</span> :
                                                                    <span className="text-red-600 dark:text-red-400"> {locale === 'ar' ? 'يوجد فجوات' : 'Has gaps'}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Total Languages</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.totalLanguages}</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Meets All</p>
                                                    <p className={cn("text-xl font-semibold", evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.meetsAllRequirements ? 'text-emerald-600' : 'text-red-600')}>
                                                        {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.meetsAllRequirements ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.gaps.length > 0 && (
                                                <div className="space-y-2 mb-3">
                                                    {evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.gaps.map((gap, idx) => (
                                                        <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{gap.language}</p>
                                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                                Has: {gap.candidate} | Needs: {gap.required} | Gap: {gap.gapLevel} level(s)
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">AI Reasoning:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.languageRequirementsAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 7. Experience Analysis - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.experienceAnalysis && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-start">
                                                            <p className="font-medium text-foreground text-sm">{t("applicants.experienceAnalysis")}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {evaluation.aiAnalysisBreakdown.experienceAnalysis.selfReported} {locale === 'ar' ? 'سنوات' : 'years'} •
                                                                {evaluation.aiAnalysisBreakdown.experienceAnalysis.meetsRequirement ?
                                                                    <span className="text-emerald-600 dark:text-emerald-400"> {locale === 'ar' ? 'يستوفي' : 'Meets req'}</span> :
                                                                    <span className="text-red-600 dark:text-red-400"> {locale === 'ar' ? 'لا يستوفي' : 'Below req'}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Self-Reported</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.experienceAnalysis.selfReported} yrs</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Required</p>
                                                    <p className="text-xl font-semibold text-foreground">{evaluation.aiAnalysisBreakdown.experienceAnalysis.required} yrs</p>
                                                </div>
                                                <div className="text-center p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground mb-1">Meets?</p>
                                                    <p className={cn("text-xl font-semibold", evaluation.aiAnalysisBreakdown.experienceAnalysis.meetsRequirement ? 'text-emerald-600' : 'text-red-600')}>
                                                        {evaluation.aiAnalysisBreakdown.experienceAnalysis.meetsRequirement ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                            {evaluation.aiAnalysisBreakdown.experienceAnalysis.gap && (
                                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-center mb-3">
                                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                        Gap: {evaluation.aiAnalysisBreakdown.experienceAnalysis.gap} year(s) below minimum
                                                    </p>
                                                </div>
                                            )}
                                            <div className="p-3 bg-card rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">AI Reasoning:</p>
                                                <p className="text-sm text-foreground leading-relaxed text-start">
                                                    {getLocalizedText(evaluation.aiAnalysisBreakdown.experienceAnalysis.aiReasoning)}
                                                </p>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {/* 8. Scoring Breakdown - Collapsible */}
                                    {evaluation.aiAnalysisBreakdown.scoringBreakdown && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="w-full">
                                                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md">
                                                            <Target className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-start">
                                                            <p className="font-medium text-foreground text-sm">{t("applicants.criteriaScoring")}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {evaluation.aiAnalysisBreakdown.scoringBreakdown.criteriaWeights.length} {locale === 'ar' ? 'معايير' : 'criteria'} •
                                                                {locale === 'ar' ? ' الدرجة النهائية: ' : ' Final score: '}{evaluation.aiAnalysisBreakdown.scoringBreakdown.totalWeightedScore.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="p-4 bg-muted/30 rounded-b-lg border-x border-b border-border -mt-2 pt-6 space-y-4">
                                            <div className="space-y-3 mb-3">
                                                {evaluation.aiAnalysisBreakdown.scoringBreakdown.criteriaWeights.map((cw, idx) => (
                                                    <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-foreground">{cw.criteriaName}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">Weight: {cw.weight}/10</Badge>
                                                                <Badge variant="outline" className="text-xs">Score: {cw.score}%</Badge>
                                                            </div>
                                                        </div>
                                                        <Progress value={cw.score} className="h-2 mb-2" />
                                                        <p className="text-xs text-muted-foreground mb-2">Contribution to final score: {cw.contribution.toFixed(1)}</p>
                                                        <div className="p-2 bg-card rounded-md border border-border">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-1">AI Reasoning:</p>
                                                            <p className="text-xs text-foreground text-start">
                                                                {getLocalizedText(cw.aiReasoning)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="font-bold text-foreground">Final Weighted Score</p>
                                                    <p className="text-2xl font-bold text-primary">{evaluation.aiAnalysisBreakdown.scoringBreakdown.totalWeightedScore.toFixed(1)}%</p>
                                                </div>
                                                <div className="p-3 bg-card rounded-lg border border-border">
                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">AI Summary:</p>
                                                    <p className="text-sm text-foreground leading-relaxed text-start">
                                                        {getLocalizedText(evaluation.aiAnalysisBreakdown.scoringBreakdown.aiSummary)}
                                                    </p>
                                                </div>
                                            </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}
                            </div>
                        )}

                        {/* Red Flags - Hidden from reviewers */}
                        {!isReviewer && (getLocalizedArray(evaluation?.redFlags).length > 0 || (applicant.aiRedFlags?.length ?? 0) > 0) && (
                            <Card className="bg-gradient-to-br from-red-50/40 via-rose-50/30 to-red-50/40 dark:from-red-950/15 dark:via-rose-950/10 dark:to-red-950/15 border border-red-200/40 dark:border-red-800/30 shadow-sm">
                                <CardHeader className="pb-4 border-b border-red-200/30 dark:border-red-800/20 bg-red-50/30 dark:bg-red-950/10">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-red-700/90 dark:text-red-400/90">
                                        <AlertTriangle className="h-5 w-5 text-red-600/80 dark:text-red-400/80" />
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
                                            className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-red-950/15 border-s-2 border-red-400/60 dark:border-red-600/50 shadow-sm"
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                <XCircle className="h-5 w-5 text-red-500/70 dark:text-red-400/70" />
                                            </div>
                                            <p className="text-sm leading-relaxed text-red-800/90 dark:text-red-200/80 whitespace-pre-line flex-1 font-medium text-start">
                                                {translateRedFlag(flag)}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Note: Status Update moved to dialog header for better UX */}
                    </TabsContent>

                    {/* Team Review Tab */}
                    <TabsContent value="review" className="p-4 sm:p-6 space-y-6 mt-0">
                        {/* Review Stats - Shows average rating from all reviewers */}
                        <ReviewStats
                            applicantId={applicant.id}
                            aiScore={evaluation?.overallScore ?? applicant.aiScore}
                            currentUserId={userId}
                            currentUserRole={userRole}
                            reviews={reviews}
                            stats={reviewStats}
                            loading={loadingReviews}
                        />

                        {/* Manual Review Form */}
                        <ManualReviewForm
                            applicantId={applicant.id}
                            jobId={applicant.jobId?._id || ''}
                            onReviewSubmitted={handleReviewSubmitted}
                            nextApplicantId={nextApplicantId}
                        />
                    </TabsContent>

                    {/* Team Notes Tab */}
                    <TabsContent value="notes" className="p-4 sm:p-6 space-y-6 mt-0">
                        <TeamNotes
                            applicantId={applicant.id}
                            comments={comments}
                            loading={loadingComments}
                            onCommentsChange={handleCommentsChange}
                        />
                    </TabsContent>
                </Tabs>

                {/* Schedule Interview Dialog */}
                {isAdmin && (
                    <ScheduleInterviewDialog
                        open={showScheduleDialog}
                        onOpenChange={setShowScheduleDialog}
                        applicantId={applicant.id}
                        jobId={applicant.jobId?._id || ''}
                        applicantName={applicant.personalData?.name || 'Candidate'}
                        applicantEmail={applicant.personalData?.email || ''}
                        onSuccess={onStatusChange}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
