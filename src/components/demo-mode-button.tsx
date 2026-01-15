"use client"

import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"

interface DemoModeButtonProps extends ButtonProps {
    isDemo?: boolean
    children: React.ReactNode
}

/**
 * A button wrapper that automatically disables destructive actions in demo mode
 * and shows a tooltip explaining why the action is disabled.
 */
export function DemoModeButton({
    isDemo,
    children,
    disabled,
    className,
    onClick,
    ...props
}: DemoModeButtonProps) {
    const { t, isRTL } = useTranslate()

    // If in demo mode, disable the button and show tooltip
    if (isDemo) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            {...props}
                            disabled={true}
                            className={cn(
                                "opacity-50 cursor-not-allowed",
                                className
                            )}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            {children}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={isRTL ? "left" : "right"} className="max-w-xs">
                        <p className="text-xs font-medium">{t("common.demoModeRestriction")}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("common.demoModeRestrictionDetails")}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Normal button behavior
    return (
        <Button
            {...props}
            disabled={disabled}
            className={className}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}
