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
                <div className="bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg shadow-lg shadow-cyan-500/50 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
                    <BookOpen className="size-4 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                </div>
                {!isCollapsed && (
                    <div className="grid flex-1 text-start text-sm leading-tight">
                        <span className="truncate font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            {brandingText}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {adminPortalText}
                        </span>
                    </div>
                )}
            </Link>
        </SidebarMenuButton>
    )
}
