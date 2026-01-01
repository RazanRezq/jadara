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

    // Apply neon glow effect to active or hovered icons
    const iconClasses = iconColor
        ? `h-4 w-4 transition-all duration-300 ${iconColor} ${
            isActive
                ? 'drop-shadow-[0_0_8px_currentColor] brightness-125'
                : 'opacity-80 group-hover/link:opacity-100 group-hover/link:drop-shadow-[0_0_6px_currentColor] group-hover/link:brightness-110'
          }`
        : `h-4 w-4 transition-all duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover/link:text-foreground'}`

    return (
        <SidebarMenuButton
            asChild
            tooltip={title}
            isActive={isActive}
        >
            <Link href={url} className="group/link">
                <Icon className={iconClasses} />
                {!isCollapsed && <span className="font-medium">{title}</span>}
            </Link>
        </SidebarMenuButton>
    )
}
