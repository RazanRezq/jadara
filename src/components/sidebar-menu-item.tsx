"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"

interface SidebarMenuItemProps {
    title: string
    url: string
    icon: LucideIcon
    iconColor?: string
    isActive: boolean
}

export function SidebarMenuItemContent({ title, url, icon: Icon, iconColor, isActive }: SidebarMenuItemProps) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    return (
        <SidebarMenuButton
            asChild
            tooltip={title}
            isActive={isActive}
        >
            <Link href={url} className="group/link">
                <Icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover/link:text-foreground'}`} />
                {!isCollapsed && <span className="font-medium">{title}</span>}
            </Link>
        </SidebarMenuButton>
    )
}
