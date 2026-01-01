"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"

interface SidebarHeaderContentProps {
    isRTL: boolean
    brandingText: string
    adminPortalText: string
}

export function SidebarHeaderContent({ isRTL, brandingText, adminPortalText }: SidebarHeaderContentProps) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    return (
        <SidebarMenuButton size="lg" asChild>
            <Link
                href="/dashboard"
                style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'flex-start',
                }}
            >
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl border-2 border-border">
                    <BookOpen className="size-5 text-foreground" />
                </div>
                {!isCollapsed && (
                    <div className="grid flex-1 text-start text-sm leading-tight">
                        <span className="truncate font-bold text-lg text-foreground">
                            {brandingText}
                        </span>
                        <span className="truncate text-xs font-medium text-muted-foreground">
                            {adminPortalText}
                        </span>
                    </div>
                )}
            </Link>
        </SidebarMenuButton>
    )
}
