"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    User,
    Mail,
    Briefcase,
    Star,
    ChevronRight,
    GripVertical,
} from "lucide-react"
import type { Applicant, ApplicantStatus } from "./applicants-client"

interface KanbanBoardProps {
    applicants: Applicant[]
    onApplicantClick: (applicant: Applicant) => void
    onStatusChange?: (applicantId: string, newStatus: ApplicantStatus) => void
}

interface KanbanColumn {
    status: ApplicantStatus
    title: string
    color: string
    bgColor: string
}

export function KanbanBoard({ applicants, onApplicantClick }: KanbanBoardProps) {
    const { t } = useTranslate()
    const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null)

    // ═══════════════════════════════════════════════════════════════════════════════
    // KANBAN COLUMNS - Based on the "Golden List" (5 statuses)
    // Only 4 columns shown (rejected is excluded from active pipeline)
    // Updated color scheme for better UX consistency
    // ═══════════════════════════════════════════════════════════════════════════════
    const columns: KanbanColumn[] = [
        {
            status: "new",
            title: t("applicants.status.new"),
            color: "text-violet-700 dark:text-violet-300",
            bgColor: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
        },
        {
            status: "evaluated",
            title: t("applicants.status.evaluated"),
            color: "text-blue-700 dark:text-blue-300",
            bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        },
        {
            status: "interview",
            title: t("applicants.status.interview"),
            color: "text-indigo-700 dark:text-indigo-300",
            bgColor: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
        },
        {
            status: "hired",
            title: t("applicants.status.hired"),
            color: "text-emerald-700 dark:text-emerald-300",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
        },
        // Note: 'rejected' is excluded from Kanban board (not part of active pipeline)
    ]

    const getApplicantsByStatus = (status: ApplicantStatus) => {
        return applicants.filter((app) => app.status === status)
    }

    const handleDragStart = (e: React.DragEvent, applicant: Applicant) => {
        setDraggedApplicant(applicant)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleDrop = (e: React.DragEvent, targetStatus: ApplicantStatus) => {
        e.preventDefault()
        if (draggedApplicant && draggedApplicant.status !== targetStatus) {
            // TODO: Implement status change API call
            console.log(`Moving ${draggedApplicant.personalData?.name} to ${targetStatus}`)
        }
        setDraggedApplicant(null)
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => {
                const columnApplicants = getApplicantsByStatus(column.status)
                const count = columnApplicants.length

                return (
                    <div key={column.status} className="flex-shrink-0 w-80">
                        <Card className={cn("h-full flex flex-col", column.bgColor)}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                    <span className={column.color}>{column.title}</span>
                                    <Badge variant="secondary" className="ms-2">
                                        {count}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-3 pt-0">
                                <ScrollArea
                                    className="h-[calc(100vh-280px)]"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.status)}
                                >
                                    <div className="space-y-2 pe-3">
                                        {columnApplicants.length === 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                {t("applicants.noApplicants")}
                                            </div>
                                        ) : (
                                            columnApplicants.map((applicant) => (
                                                <Card
                                                    key={applicant.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, applicant)}
                                                    className={cn(
                                                        "p-3 cursor-move hover:shadow-md transition-all bg-white dark:bg-slate-900 border",
                                                        draggedApplicant?.id === applicant.id && "opacity-50"
                                                    )}
                                                    onClick={() => onApplicantClick(applicant)}
                                                >
                                                    <div className="space-y-2">
                                                        {/* Header with drag handle */}
                                                        <div className="flex items-start gap-2">
                                                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-sm truncate flex items-center gap-2">
                                                                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                    {applicant.personalData?.name || "N/A"}
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        {/* Job Title */}
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Briefcase className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{applicant.jobId?.title || "N/A"}</span>
                                                        </div>

                                                        {/* Email */}
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{applicant.personalData?.email}</span>
                                                        </div>

                                                        {/* AI Score */}
                                                        {applicant.aiScore !== undefined && (
                                                            <div className="flex items-center justify-between pt-2 border-t">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                                                                    <span className="text-xs font-medium">
                                                                        {applicant.aiScore}%
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onApplicantClick(applicant)
                                                                    }}
                                                                >
                                                                    {t("common.view")}
                                                                    <ChevronRight className="h-3 w-3 ms-1" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            ))
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
