"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    BookOpen,
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    BarChart3,
    MessageSquare,
    Shield,
    LifeBuoy,
    Send,
    Briefcase,
    UserCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
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

    const navMain = React.useMemo(() => {
        const items = [
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
                requiredRole: "admin" as UserRole,
            },
            {
                title: t("sidebar.applicants"),
                url: "/dashboard/applicants",
                icon: UserCheck,
                isActive: pathname.startsWith("/dashboard/applicants"),
                requiredRole: "reviewer" as UserRole,
            },
            {
                title: t("sidebar.content"),
                url: "/dashboard/content",
                icon: FileText,
                isActive: pathname.startsWith("/dashboard/content"),
                requiredRole: "reviewer" as UserRole,
                items: [
                    { title: t("sidebar.reading") || "Reading", url: "/dashboard/content/reading" },
                    { title: t("sidebar.writing") || "Writing", url: "/dashboard/content/writing" },
                    { title: t("sidebar.listening") || "Listening", url: "/dashboard/content/listening" },
                    { title: t("sidebar.speaking") || "Speaking", url: "/dashboard/content/speaking" },
                ],
            },
            {
                title: t("sidebar.reviews"),
                url: "/dashboard/reviews",
                icon: MessageSquare,
                isActive: pathname.startsWith("/dashboard/reviews"),
                requiredRole: "reviewer" as UserRole,
            },
            {
                title: t("sidebar.analytics"),
                url: "/dashboard/analytics",
                icon: BarChart3,
                isActive: pathname.startsWith("/dashboard/analytics"),
                requiredRole: "admin" as UserRole,
            },
            {
                title: t("sidebar.users"),
                url: "/dashboard/users",
                icon: Users,
                isActive: pathname.startsWith("/dashboard/users"),
                requiredRole: "admin" as UserRole,
            },
            {
                title: t("sidebar.roles"),
                url: "/dashboard/roles",
                icon: Shield,
                isActive: pathname.startsWith("/dashboard/roles"),
                requiredRole: "superadmin" as UserRole,
            },
            {
                title: t("sidebar.settings"),
                url: "/dashboard/settings",
                icon: Settings,
                isActive: pathname.startsWith("/dashboard/settings"),
                requiredRole: "superadmin" as UserRole,
            },
        ]

        return items.filter((item) => hasPermission(user.role, item.requiredRole))
    }, [t, pathname, user.role])

    const navSecondary = [
        {
            title: t("sidebar.support") || "Support",
            url: "/dashboard/support",
            icon: LifeBuoy,
        },
        {
            title: t("sidebar.feedback") || "Feedback",
            url: "/dashboard/feedback",
            icon: Send,
        },
    ]

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
                <NavMain items={navMain} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
