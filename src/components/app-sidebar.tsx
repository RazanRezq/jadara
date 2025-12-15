"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    BookOpen,
    LayoutDashboard,
    Users,
    Settings,
    Shield,
    Briefcase,
    Calendar,
    Library,
    ClipboardCheck,
    Video,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useTranslate } from "@/hooks/useTranslate"
import { hasPermission, type UserRole } from "@/lib/auth"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: {
        name: string
        email: string
        role: UserRole
    }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const { t, isRTL } = useTranslate()
    const pathname = usePathname()

    // Navigation structure with grouped sections for ATS
    const navSections = React.useMemo(() => {
        return [
            {
                title: t("sidebar.categories.operations"),
                items: [
                    {
                        title: t("sidebar.dashboard"),
                        url: "/dashboard",
                        icon: LayoutDashboard,
                        isActive: pathname === "/dashboard",
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.jobs"),
                        url: "/dashboard/jobs",
                        icon: Briefcase,
                        isActive: pathname.startsWith("/dashboard/jobs"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.candidates"),
                        url: "/dashboard/candidates",
                        icon: Users,
                        isActive: pathname.startsWith("/dashboard/candidates"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.calendar"),
                        url: "/dashboard/calendar",
                        icon: Calendar,
                        isActive: pathname.startsWith("/dashboard/calendar"),
                        requiredRole: "reviewer" as UserRole,
                    },
                ],
            },
            {
                title: t("sidebar.categories.assessmentTools"),
                items: [
                    {
                        title: t("sidebar.questionBank"),
                        url: "/dashboard/questions",
                        icon: Library,
                        isActive: pathname.startsWith("/dashboard/questions"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.scorecards"),
                        url: "/dashboard/scorecards",
                        icon: ClipboardCheck,
                        isActive: pathname.startsWith("/dashboard/scorecards"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.interviews"),
                        url: "/dashboard/interviews",
                        icon: Video,
                        isActive: pathname.startsWith("/dashboard/interviews"),
                        requiredRole: "reviewer" as UserRole,
                    },
                ],
            },
            {
                title: t("sidebar.categories.systemManagement"),
                items: [
                    {
                        title: t("sidebar.team"),
                        url: "/dashboard/team",
                        icon: Shield,
                        isActive: pathname.startsWith("/dashboard/team"),
                        requiredRole: "admin" as UserRole,
                    },
                    {
                        title: t("sidebar.settings"),
                        url: "/dashboard/settings",
                        icon: Settings,
                        isActive: pathname.startsWith("/dashboard/settings"),
                        requiredRole: "admin" as UserRole,
                    },
                ],
            },
        ]
    }, [t, pathname])

    return (
        <Sidebar
            collapsible="icon"
            side={isRTL ? "right" : "left"}
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg shadow-lg shadow-cyan-500/20">
                                    <BookOpen className="size-4" />
                                </div>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                        GoIELTS
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {t("branding.adminPortal")}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {navSections.map((section) => {
                    // Filter items based on user permissions
                    const filteredItems = section.items.filter((item) =>
                        hasPermission(user.role, item.requiredRole)
                    )

                    // Only render section if there are visible items
                    if (filteredItems.length === 0) return null

                    return (
                        <SidebarGroup key={section.title}>
                            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {filteredItems.map((item) => (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.title}
                                                isActive={item.isActive}
                                            >
                                                <Link href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                })}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
