"use client"

import { usePathname } from "next/navigation"
import { getNavigationByRoute, getIconColorClass } from "@/config/navigation"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    /** Optional override for title translation key */
    titleKey?: string
    /** Optional override for title text (use this if not using translation) */
    title?: string
    /** Optional subtitle translation key */
    subtitleKey?: string
    /** Optional subtitle text */
    subtitle?: string
    /** Additional className for the container */
    className?: string
    /** Additional className for the title */
    titleClassName?: string
    /** Override icon size (default: h-7 w-7) */
    iconSize?: string
}

export function PageHeader({
    titleKey,
    title,
    subtitleKey,
    subtitle,
    className,
    titleClassName,
    iconSize = "h-7 w-7",
}: PageHeaderProps) {
    const pathname = usePathname()
    const { t } = useTranslate()
    const navItem = getNavigationByRoute(pathname)

    if (!navItem) {
        // Fallback if no navigation item found
        return title || titleKey ? (
            <div className={cn("px-4 pt-6 pb-4", className)}>
                <div className="mb-2">
                    <h1 className={cn("text-3xl font-bold tracking-tight", titleClassName)}>
                        {title || (titleKey ? t(titleKey) : "")}
                    </h1>
                </div>
                {(subtitle || subtitleKey) && (
                    <p className="text-muted-foreground mt-2">
                        {subtitle || (subtitleKey ? t(subtitleKey) : "")}
                    </p>
                )}
            </div>
        ) : null
    }

    const Icon = navItem.icon
    const iconColorClass = getIconColorClass(navItem)
    const displayTitle = title || (titleKey ? t(titleKey) : t(navItem.titleKey))
    const displaySubtitle = subtitle || (subtitleKey ? t(subtitleKey) : "")

    return (
        <div className={cn("px-4 pt-6 pb-4", className)}>
            <div className="flex items-center gap-3 mb-2">
                <Icon className={cn(iconSize, iconColorClass)} />
                <h1 className={cn("text-3xl font-bold tracking-tight", titleClassName)}>
                    {displayTitle}
                </h1>
            </div>
            {displaySubtitle && (
                <p className="text-muted-foreground mt-2">
                    {displaySubtitle}
                </p>
            )}
        </div>
    )
}
