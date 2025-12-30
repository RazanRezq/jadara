"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/auth"
import {
    Briefcase,
    Star,
    ChevronRight,
    GripVertical,
    AlertTriangle,
    Users,
    UserCheck,
    Crown,
    Shield,
    Clock,
    Calendar,
} from "lucide-react"
import type { Applicant, ApplicantStatus, EvaluationData, KanbanColumn, ReviewsByApplicant } from "./types"
import { IBM_Plex_Sans_Arabic } from "next/font/google"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
})

interface ApplicantBoardProps {
    applicants: Applicant[]
    evaluations: Map<string, EvaluationData>
    reviewsByApplicant: ReviewsByApplicant
    onApplicantClick: (applicant: Applicant) => void
    onStatusChange?: (applicantId: string, newStatus: ApplicantStatus) => void
    onScheduleInterview?: (applicant: Applicant) => void
    userRole: UserRole
}

// Get badge color and icon based on reviewer role
const getReviewerBadgeStyle = (role: string) => {
    switch (role) {
        case 'superadmin':
            return {
                bg: 'bg-amber-100 dark:bg-amber-900/50',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-300 dark:border-amber-700',
                icon: Crown,
                label: '👑'
            }
        case 'admin':
            return {
                bg: 'bg-purple-100 dark:bg-purple-900/50',
                text: 'text-purple-700 dark:text-purple-300',
                border: 'border-purple-300 dark:border-purple-700',
                icon: Shield,
                label: '🟣'
            }
        default: // reviewer
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/50',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-300 dark:border-blue-700',
                icon: UserCheck,
                label: '🔵'
            }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN BOARD COLUMNS - Based on the "Golden List" (5 statuses)
// Only 4 columns shown (rejected is excluded from active pipeline)
// API normalizes all legacy statuses before data reaches the frontend
// ═══════════════════════════════════════════════════════════════════════════════
const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: "new",
        title: "new",
        statuses: ["new"],  // AI scored, awaiting human review
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50",
    },
    {
        id: "evaluated",
        title: "evaluated",
        statuses: ["evaluated"],  // Reviewed by team member
        color: "text-purple-700 dark:text-purple-300",
        bgColor: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/50",
    },
    {
        id: "interview",
        title: "interview",
        statuses: ["interview"],  // In interview process
        color: "text-amber-700 dark:text-amber-300",
        bgColor: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50",
    },
    {
        id: "hired",
        title: "hired",
        statuses: ["hired"],  // Final positive outcome
        color: "text-emerald-700 dark:text-emerald-300",
        bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50",
    },
    // Note: 'rejected' is excluded from Kanban board (not part of active pipeline)
]

export function ApplicantBoard({
    applicants,
    evaluations,
    reviewsByApplicant,
    onApplicantClick,
    onStatusChange,
    onScheduleInterview,
    userRole,
}: ApplicantBoardProps) {
    const { t, isRTL } = useTranslate()
    const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

    const getApplicantsByColumn = (column: KanbanColumn) => {
        return applicants.filter((app) => column.statuses.includes(app.status))
    }

    const handleDragStart = (e: React.DragEvent, applicant: Applicant) => {
        setDraggedApplicant(applicant)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = (e: React.DragEvent, column: KanbanColumn) => {
        e.preventDefault()
        if (draggedApplicant && !column.statuses.includes(draggedApplicant.status)) {
            // Use the first status of the target column as the new status
            const newStatus = column.statuses[0]
            onStatusChange?.(draggedApplicant.id, newStatus)
        }
        setDraggedApplicant(null)
        setDragOverColumn(null)
    }

    // Avatar gradient colors
    const getAvatarGradient = (name: string) => {
        const gradients = [
            "from-violet-400 to-purple-500",
            "from-blue-400 to-cyan-500",
            "from-emerald-400 to-teal-500",
            "from-amber-400 to-orange-500",
            "from-pink-400 to-rose-500",
            "from-indigo-400 to-blue-500",
        ]
        const index = (name?.charCodeAt(0) || 0) % gradients.length
        return gradients[index]
    }

    // Score badge color
    const getScoreBadgeColor = (score?: number) => {
        if (!score) return "bg-muted text-muted-foreground"
        if (score >= 75) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
        if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
    }

    return (
        <div
            dir={isRTL ? "rtl" : "ltr"}
            className={cn(
                "grid gap-3 sm:gap-4",
                // Responsive columns: 1 on mobile, 2 on sm, 2 on md, 4 on lg+
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
                ibmPlexArabic.className
            )}
        >
            {KANBAN_COLUMNS.map((column) => {
                const columnApplicants = getApplicantsByColumn(column)
                const count = columnApplicants.length
                const isDragOver = dragOverColumn === column.id

                return (
                    <div key={column.id} className="min-h-[350px] sm:min-h-[400px]">
                        <Card
                            className={cn(
                                "h-full flex flex-col transition-all duration-200",
                                column.bgColor,
                                isDragOver && "ring-2 ring-primary ring-offset-2"
                            )}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column)}
                        >
                            <CardHeader
                                dir={isRTL ? "rtl" : "ltr"}
                                className={cn(
                                    "pb-2 px-3 pt-3 sm:pb-3",
                                    isRTL ? "text-right" : "text-left"
                                )}
                            >
                                <CardTitle className="text-sm font-semibold flex items-center justify-between w-full">
                                    {isRTL ? (
                                        <>
                                            {/* RTL: Label on RIGHT (start), Badge on LEFT (end) */}
                                            <span className={column.color}>
                                                {t(`applicants.kanban.${column.title}`)}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:ring-1 dark:ring-slate-600 font-bold px-2.5"
                                            >
                                                {count}
                                            </Badge>
                                        </>
                                    ) : (
                                        <>
                                            {/* LTR: Label on LEFT (start), Badge on RIGHT (end) */}
                                            <span className={column.color}>
                                                {t(`applicants.kanban.${column.title}`)}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:ring-1 dark:ring-slate-600 font-bold px-2.5"
                                            >
                                                {count}
                                            </Badge>
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-2 pt-0">
                                <ScrollArea className="h-[calc(100vh-350px)] sm:h-[calc(100vh-320px)] lg:h-[calc(100vh-280px)]">
                                    <div className="space-y-2.5 sm:space-y-3 pe-2">
                                        {columnApplicants.length === 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>
                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                <p>{t("applicants.noApplicants")}</p>
                                            </div>
                                        ) : (
                                            columnApplicants.map((applicant) => {
                                                const evaluation = evaluations.get(applicant.id)
                                                const score = evaluation?.overallScore ?? applicant.aiScore

                                                return (
                                                    <Card
                                                        key={applicant.id}
                                                        dir={isRTL ? "rtl" : "ltr"}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, applicant)}
                                                        className={cn(
                                                            "p-4 sm:p-5 cursor-grab active:cursor-grabbing",
                                                            "hover:shadow-md transition-all duration-200",
                                                            "bg-background border hover:border-primary/30",
                                                            draggedApplicant?.id === applicant.id && "opacity-50 scale-95",
                                                            ibmPlexArabic.className
                                                        )}
                                                        onClick={() => onApplicantClick(applicant)}
                                                    >
                                                        <div className="space-y-3">
                                                            {/* Header with Avatar and Name */}
                                                            <div className="flex items-start gap-3">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1 hidden sm:block" />
                                                                <div
                                                                    className={cn(
                                                                        "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-base shrink-0",
                                                                        getAvatarGradient(applicant.displayName || applicant.personalData?.name || "A")
                                                                    )}
                                                                >
                                                                    {(applicant.displayName || applicant.personalData?.name)?.charAt(0)?.toUpperCase() || 'A'}
                                                                </div>
                                                                <div className={cn(
                                                                    "flex-1 min-w-0",
                                                                    isRTL ? "text-right" : "text-left"
                                                                )}>
                                                                    <div className={cn(
                                                                        "flex items-center gap-1.5",
                                                                        isRTL ? "flex-row-reverse justify-end" : "flex-row"
                                                                    )}>
                                                                        <h4 className="font-semibold text-base truncate">
                                                                            {applicant.displayName || applicant.personalData?.name || "Unnamed"}
                                                                        </h4>
                                                                        {applicant.isSuspicious && (
                                                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "flex items-center gap-1 text-xs text-muted-foreground mt-0.5",
                                                                        isRTL ? "flex-row-reverse justify-end" : "flex-row"
                                                                    )}>
                                                                        <Briefcase className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate">
                                                                            {applicant.jobId?.title || "N/A"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Tags */}
                                                            {applicant.tags && applicant.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {applicant.tags.slice(0, 2).map((tag, index) => (
                                                                        <Badge
                                                                            key={index}
                                                                            variant="secondary"
                                                                            className="text-[10px] h-5 px-2 bg-muted/60"
                                                                        >
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                    {applicant.tags.length > 2 && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-[10px] h-5 px-2 bg-muted/40"
                                                                        >
                                                                            +{applicant.tags.length - 2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Interview Date/Time - Only show for interview status */}
                                                            {applicant.status === 'interview' && applicant.interview && (
                                                                <div
                                                                    className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-md px-3 py-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30 animate-pulse-glow"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (!applicant.interview?.scheduledDate) return
                                                                        const date = new Date(applicant.interview.scheduledDate).toISOString().split('T')[0]
                                                                        window.location.href = `/dashboard/calendar?date=${date}&applicantId=${applicant.id}`
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className={cn(
                                                                            "flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300",
                                                                            isRTL ? "flex-row-reverse" : "flex-row"
                                                                        )}>
                                                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="font-medium">
                                                                                {applicant.interview?.scheduledDate && new Date(applicant.interview.scheduledDate).toLocaleDateString(
                                                                                    isRTL ? 'ar-SA' : 'en-US',
                                                                                    { weekday: 'short', month: 'short', day: 'numeric' }
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300",
                                                                            isRTL ? "flex-row-reverse" : "flex-row"
                                                                        )}>
                                                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="font-medium">
                                                                                {applicant.interview?.scheduledTime} ({applicant.interview?.duration} min)
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Reviewer Badges - Transparency Display */}
                                                            {(reviewsByApplicant.get(applicant.id)?.length ?? 0) > 0 && (
                                                                <TooltipProvider>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {reviewsByApplicant.get(applicant.id)?.map((review) => {
                                                                            const style = getReviewerBadgeStyle(review.reviewerRole)
                                                                            const Icon = style.icon
                                                                            return (
                                                                                <Tooltip key={review.reviewerId}>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div
                                                                                            className={cn(
                                                                                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-default",
                                                                                                style.bg,
                                                                                                style.text,
                                                                                                style.border
                                                                                            )}
                                                                                        >
                                                                                            <Icon className="h-3 w-3" />
                                                                                            <Star className="h-2.5 w-2.5 fill-current" />
                                                                                            <span>{review.rating}</span>
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="top" className="text-xs">
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            <span className="font-medium">{review.reviewerName}</span>
                                                                                            <span className="text-muted-foreground capitalize">
                                                                                                {review.reviewerRole === 'superadmin' ? 'Super Admin' : review.reviewerRole}
                                                                                            </span>
                                                                                        </div>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </TooltipProvider>
                                                            )}

                                                            {/* Score and Action Footer - Balanced Layout */}
                                                            {/* RTL: Score on RIGHT (start), Button on LEFT (end) */}
                                                            {/* LTR: Score on LEFT (start), Button on RIGHT (end) */}
                                                            <div className="flex items-center justify-between pt-2 border-t w-full">
                                                                {/* AI Match Score */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                                                                    <span className={cn(
                                                                        "text-sm font-bold",
                                                                        getScoreBadgeColor(score).includes("emerald") && "text-emerald-600",
                                                                        getScoreBadgeColor(score).includes("amber") && "text-amber-600",
                                                                        getScoreBadgeColor(score).includes("red") && "text-red-600"
                                                                    )}>
                                                                        {score ? `${score}%` : "-"}
                                                                    </span>
                                                                </div>
                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-1">
                                                                    {/* Edit Time Button - Only for interview status */}
                                                                    {applicant.status === 'interview' && onScheduleInterview && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 px-2 text-xs"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                onScheduleInterview(applicant)
                                                                            }}
                                                                        >
                                                                            <Clock className="h-3 w-3 me-1" />
                                                                            {t("applicants.editTime") || "Edit Time"}
                                                                        </Button>
                                                                    )}
                                                                    {/* View Button */}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-xs"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            onApplicantClick(applicant)
                                                                        }}
                                                                    >
                                                                        {t("common.view")}
                                                                        <ChevronRight className="h-3 w-3 ms-0.5 rtl:rotate-180" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
}
