"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Search,
    LayoutList,
    Columns3,
    RefreshCw,
} from "lucide-react"
import type { ViewMode } from "./types"

interface ApplicantsToolbarProps {
    // View state
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
    // Search
    searchTerm: string
    onSearchChange: (value: string) => void
    // Job filter
    jobs: { id: string; title: string }[]
    jobFilter: string
    onJobFilterChange: (jobId: string) => void
    // Filter component slot (renders the popover)
    filterSlot: ReactNode
    // Export component slot (renders the export button)
    exportSlot?: ReactNode
    // AI Evaluation slot (renders the run AI evaluation button)
    aiEvaluationSlot?: ReactNode
    // Stats
    totalApplicants: number
    // Actions
    onRefresh: () => void
    isLoading: boolean
}

export function ApplicantsToolbar({
    viewMode,
    onViewModeChange,
    searchTerm,
    onSearchChange,
    jobs,
    jobFilter,
    onJobFilterChange,
    filterSlot,
    exportSlot,
    aiEvaluationSlot,
    totalApplicants,
    onRefresh,
    isLoading,
}: ApplicantsToolbarProps) {
    const { t } = useTranslate()

    return (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col gap-4 p-4">
                {/* Controls Row: Search + Dropdown + Actions */}
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    {/* Left: Search + Job Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
                            <Input
                                placeholder={t("applicants.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="h-10 ps-10"
                            />
                        </div>

                        {/* Job Filter */}
                        <Select value={jobFilter} onValueChange={onJobFilterChange}>
                            <SelectTrigger className="w-full sm:w-[200px] h-10">
                                <SelectValue placeholder={t("applicants.selectJob")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("applicants.allJobs")}</SelectItem>
                                {jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id}>
                                        {job.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right: View Toggle + Filter Button + Export + Refresh */}
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(value) => {
                                if (value) onViewModeChange(value as ViewMode)
                            }}
                            className="bg-muted p-1 rounded-lg"
                        >
                            <ToggleGroupItem
                                value="list"
                                aria-label={t("applicants.listView")}
                                className="h-8 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                            >
                                <LayoutList className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="board"
                                aria-label={t("applicants.boardView")}
                                className="h-8 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                            >
                                <Columns3 className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>

                        {/* Filter Popover Slot */}
                        {filterSlot}

                        {/* AI Evaluation Button Slot */}
                        {aiEvaluationSlot}

                        {/* Export Button Slot */}
                        {exportSlot}

                        {/* Refresh Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="h-9 w-9"
                        >
                            <RefreshCw className={cn(
                                "h-4 w-4",
                                isLoading && "animate-spin"
                            )} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
