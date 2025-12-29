"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Filter, X, Sparkles, RotateCcw } from "lucide-react"
import type { ApplicantsFilterState } from "./types"

// استيراد الخط
import { IBM_Plex_Sans_Arabic } from "next/font/google"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
})

const SKILL_OPTIONS = [
    "React", "Node.js", "TypeScript", "Python", "Angular", "Vue.js",
    "Docker", "AWS", "Java", "GraphQL", "MongoDB", "PostgreSQL"
]

const STATUS_OPTIONS = [
    "new", "evaluated", "interview", "hired", "rejected"
] as const

interface ApplicantFiltersProps {
    filters: ApplicantsFilterState
    onFiltersChange: (filters: ApplicantsFilterState) => void
    onClearAll: () => void
}

function createLocalFiltersFrom(filters: ApplicantsFilterState) {
    return {
        statusFilters: new Set(filters.statusFilters),
        minScore: filters.minScore,
        experienceRange: [...filters.experienceRange] as [number, number],
        selectedSkills: new Set(filters.selectedSkills),
    }
}

export function ApplicantFilters({
    filters,
    onFiltersChange,
}: ApplicantFiltersProps) {
    const { t, isRTL } = useTranslate()
    const [open, setOpen] = useState(false)
    const [localFilters, setLocalFilters] = useState(() => createLocalFiltersFrom(filters))

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) setLocalFilters(createLocalFiltersFrom(filters))
        setOpen(newOpen)
    }

    const handleStatusToggle = (status: string) => {
        const newFilters = new Set(localFilters.statusFilters)
        if (newFilters.has(status)) newFilters.delete(status)
        else newFilters.add(status)
        setLocalFilters(prev => ({ ...prev, statusFilters: newFilters }))
    }

    const handleSkillToggle = (skill: string) => {
        const newSkills = new Set(localFilters.selectedSkills)
        if (newSkills.has(skill)) newSkills.delete(skill)
        else newSkills.add(skill)
        setLocalFilters(prev => ({ ...prev, selectedSkills: newSkills }))
    }

    const handleReset = () => {
        setLocalFilters({
            statusFilters: new Set<string>(),
            minScore: 0,
            experienceRange: [0, 20],
            selectedSkills: new Set<string>(),
        })
    }

    const handleApply = () => {
        onFiltersChange({
            ...filters,
            statusFilters: localFilters.statusFilters,
            minScore: localFilters.minScore,
            experienceRange: localFilters.experienceRange,
            selectedSkills: localFilters.selectedSkills,
        })
        setOpen(false)
    }

    const hasLocalActiveFilters =
        localFilters.statusFilters.size > 0 ||
        localFilters.minScore > 0 ||
        localFilters.selectedSkills.size > 0 ||
        localFilters.experienceRange[0] > 0 ||
        localFilters.experienceRange[1] < 20

    const hasParentActiveFilters =
        filters.statusFilters.size > 0 ||
        filters.minScore > 0 ||
        filters.selectedSkills.size > 0 ||
        filters.experienceRange[0] > 0 ||
        filters.experienceRange[1] < 20

    const activeFilterCount =
        filters.statusFilters.size +
        (filters.minScore > 0 ? 1 : 0) +
        filters.selectedSkills.size +
        (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 20 ? 1 : 0)

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 gap-2",
                        ibmPlexArabic.className,
                        hasParentActiveFilters && "border-primary bg-primary/5"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    {t("applicants.filters")}
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={8}
                className={cn(
                    "w-[380px] p-0 applicant-filter-popover",
                    // 👇 إجبار المحاذاة لليمين
                    isRTL ? "text-right" : "text-left"
                )}
                // 👇 محاولة أخيرة لفرض الاتجاه عبر الخاصية الأصلية
                dir={isRTL ? "rtl" : "ltr"}
            >
                {/* Global Style Injection for Font Override */}
                <style jsx global>{`
                    .applicant-filter-popover * {
                        font-family: ${ibmPlexArabic.style.fontFamily} !important;
                    }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h4 className="text-sm font-semibold">{t("applicants.filters")}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("applicants.filtersDescription")}</p>
                    </div>
                    {hasLocalActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive shrink-0"
                        >
                            <RotateCcw className={cn("h-3 w-3", isRTL ? "ms-1" : "me-1")} />
                            {t("applicants.clearAll")}
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="h-[400px]">
                    <div className="px-4" dir={isRTL ? "rtl" : "ltr"}>
                        <Accordion type="multiple" defaultValue={["status", "score", "experience", "skills"]} className="w-full">

                            {/* Status */}
                            <AccordionItem value="status" className="border-b">
                                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        {t("applicants.applicationStatus")}
                                        {localFilters.statusFilters.size > 0 && (
                                            <Badge variant="secondary" className="text-xs h-5 px-1.5">{localFilters.statusFilters.size}</Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="space-y-2.5">
                                        {STATUS_OPTIONS.map((status) => (
                                            <label
                                                key={status}
                                                className={cn(
                                                    "flex items-center gap-3 cursor-pointer group",
                                                    // 👇 التعديل الجوهري: إذا كان RTL، نعكس الاتجاه يدوياً ليصبح المربع يمين النص
                                                    // لأن المتصفح قد يرى الكونتينر LTR بالخطأ
                                                    isRTL ? "flex-row-reverse justify-end" : "flex-row"
                                                )}
                                            >
                                                {/* في حالة flex-row-reverse: العنصر الثاني (span) سيظهر أولاً (يسار)، والعنصر الأول (checkbox) سيظهر آخراً (يمين) */}
                                                {/* لا.. flex-row-reverse في بيئة LTR تعني: العنصر الأول يروح أقصى اليمين. */}

                                                {/* لضمان الترتيب الصحيح بغض النظر عن الـ dir: */}
                                                {/* سنضع Checkbox دائماً أولاً في الكود، ونتحكم بالاتجاه */}

                                                {/* إذا كان عربي: نريد [Checkbox] [Text] (محاذاة لليمين) */}
                                                {/* الكود الحالي مع dir=rtl يجب أن يعمل. إذا فشل، نستخدم الترتيب اليدوي */}

                                                <Checkbox
                                                    checked={localFilters.statusFilters.has(status)}
                                                    onCheckedChange={() => handleStatusToggle(status)}
                                                />
                                                <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors flex-1">
                                                    {t(`applicants.status.${status}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Score */}
                            <AccordionItem value="score" className="border-b">
                                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        {t("applicants.matchScore")}
                                        {localFilters.minScore > 0 && (
                                            <Badge variant="secondary" className="text-xs h-5 px-1.5">≥{localFilters.minScore}%</Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{t("applicants.minScore")}</span>
                                            <span className="font-bold text-primary text-lg">{localFilters.minScore}%</span>
                                        </div>
                                        <Slider
                                            value={[localFilters.minScore]}
                                            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, minScore: value[0] }))}
                                            max={100} step={5} className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0%</span><span>50%</span><span>100%</span>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Experience */}
                            <AccordionItem value="experience" className="border-b">
                                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        {t("applicants.yearsOfExperience")}
                                        {(localFilters.experienceRange[0] > 0 || localFilters.experienceRange[1] < 20) && (
                                            <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                                {localFilters.experienceRange[0]}-{localFilters.experienceRange[1]}
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">{t("applicants.from")}</Label>
                                            <Input
                                                type="number"
                                                value={localFilters.experienceRange[0]}
                                                onChange={(e) => setLocalFilters(prev => ({ ...prev, experienceRange: [parseInt(e.target.value) || 0, prev.experienceRange[1]] }))}
                                                className="h-9 mt-1.5" min={0} max={20}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">{t("applicants.to")}</Label>
                                            <Input
                                                type="number"
                                                value={localFilters.experienceRange[1]}
                                                onChange={(e) => setLocalFilters(prev => ({ ...prev, experienceRange: [prev.experienceRange[0], parseInt(e.target.value) || 20] }))}
                                                className="h-9 mt-1.5" min={0} max={20}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Skills */}
                            <AccordionItem value="skills" className="border-0">
                                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        {t("applicants.skills")}
                                        {localFilters.selectedSkills.size > 0 && (
                                            <Badge variant="secondary" className="text-xs h-5 px-1.5">{localFilters.selectedSkills.size}</Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {SKILL_OPTIONS.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant={localFilters.selectedSkills.has(skill) ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer transition-all text-xs py-1.5",
                                                    localFilters.selectedSkills.has(skill) ? "bg-primary hover:bg-primary/90" : "hover:bg-muted hover:border-primary/50"
                                                )}
                                                onClick={() => handleSkillToggle(skill)}
                                            >
                                                {skill}
                                                {localFilters.selectedSkills.has(skill) && <X className="h-3 w-3 ms-1" />}
                                            </Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t">
                    <Button variant="outline" onClick={handleReset} disabled={!hasLocalActiveFilters} className="flex-1">
                        <RotateCcw className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")} />
                        {t("applicants.resetFilters")}
                    </Button>
                    <Button onClick={handleApply} className="flex-1">
                        {t("applicants.applyFilters")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}