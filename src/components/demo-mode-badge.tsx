"use client"

import { ShieldAlert } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface DemoModeBadgeProps {
    isDemo: boolean
    variant?: "header" | "sidebar" | "compact"
    className?: string
}

export function DemoModeBadge({ isDemo, variant = "header", className }: DemoModeBadgeProps) {
    const { t, isRTL } = useTranslate()

    if (!isDemo) return null

    if (variant === "compact") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full",
                            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                            "border border-amber-300 dark:border-amber-700",
                            className
                        )}>
                            <ShieldAlert className="w-3 h-3" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                                {t("header.demoMode")}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? "left" : "right"}>
                        <p className="text-xs">{t("header.demoModeTooltip")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    if (variant === "sidebar") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 mx-2 mb-2 rounded-lg",
                            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                            "border border-amber-300 dark:border-amber-700",
                            className
                        )}>
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold">{t("header.demoMode")}</span>
                                <span className="text-[10px] opacity-80">{t("header.demoModeReadOnly")}</span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? "left" : "right"}>
                        <p className="text-xs">{t("header.demoModeTooltip")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Default header variant
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-help",
                        "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40",
                        "text-amber-700 dark:text-amber-300",
                        "border border-amber-300/60 dark:border-amber-600/40",
                        "shadow-sm",
                        "animate-pulse",
                        className
                    )}>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{t("header.demoMode")}</span>
                        <span className="text-[10px] opacity-70 hidden sm:inline">
                            • {t("header.demoModeReadOnly")}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{t("header.demoModeTooltip")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
