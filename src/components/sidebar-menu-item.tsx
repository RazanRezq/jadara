"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"

interface SidebarMenuItemProps {
    title: string
    url: string
    icon: LucideIcon
    iconColor: string
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
            <Link href={url}>
                <Icon className={`${iconColor} transition-all duration-200 drop-shadow-[0_0_8px_currentColor]`} />
                {!isCollapsed && <span>{title}</span>}
            </Link>
        </SidebarMenuButton>
    )
}
