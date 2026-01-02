"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Shield,
    Briefcase,
    Calendar,
    Library,
    ClipboardCheck,
    Video,
    ScrollText,
    UserCog,
    Activity,
    Settings,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useTranslate } from "@/hooks/useTranslate"
import { type UserRole } from "@/lib/auth"
import { hasRolePermission } from "@/lib/authClient"
import { SidebarMenuItemContent } from "@/components/sidebar-menu-item"
import { SidebarHeaderContent } from "@/components/sidebar-header-content"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: {
        name: string
        email: string
        role: UserRole
    }
    initialDirection?: "ltr" | "rtl"
}

export function AppSidebar({ user, initialDirection, ...props }: AppSidebarProps) {
    const { t, isRTL, locale, mounted } = useTranslate()
    const pathname = usePathname()

    // Use initial direction from server to prevent hydration mismatch
    const [sidebarSide, setSidebarSide] = React.useState<"left" | "right">(
        initialDirection === "rtl" ? "right" : "left"
    )

    // Update sidebar side when language changes (user switches language)
    React.useEffect(() => {
        if (mounted) {
            setSidebarSide(isRTL ? "right" : "left")
        }
    }, [isRTL, mounted])

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
                        iconColor: "text-cyan-400",
                        isActive: pathname === "/dashboard",
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.jobs"),
                        url: "/dashboard/jobs",
                        icon: Briefcase,
                        iconColor: "text-purple-400",
                        isActive: pathname.startsWith("/dashboard/jobs"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.candidates"),
                        url: "/dashboard/applicants",
                        icon: Users,
                        iconColor: "text-pink-400",
                        isActive: pathname.startsWith("/dashboard/applicants"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.calendar"),
                        url: "/dashboard/calendar",
                        icon: Calendar,
                        iconColor: "text-blue-400",
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
                        iconColor: "text-emerald-400",
                        isActive: pathname.startsWith("/dashboard/questions"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.scorecards"),
                        url: "/dashboard/scorecards",
                        icon: ClipboardCheck,
                        iconColor: "text-amber-400",
                        isActive: pathname.startsWith("/dashboard/scorecards"),
                        requiredRole: "reviewer" as UserRole,
                    },
                    {
                        title: t("sidebar.interviews"),
                        url: "/dashboard/interviews",
                        icon: Video,
                        iconColor: "text-red-400",
                        isActive: pathname.startsWith("/dashboard/interviews"),
                        requiredRole: "reviewer" as UserRole,
                    },
                ],
            },
            {
                title: t("sidebar.categories.systemManagement"),
                items: [
                    {
                        title: t("sidebar.users"),
                        url: "/dashboard/users",
                        icon: UserCog,
                        iconColor: "text-violet-400",
                        isActive: pathname.startsWith("/dashboard/users"),
                        requiredRole: "superadmin" as UserRole,
                    },
                    {
                        title: t("sidebar.sessions"),
                        url: "/dashboard/sessions",
                        icon: Activity,
                        iconColor: "text-lime-400",
                        isActive: pathname.startsWith("/dashboard/sessions"),
                        requiredRole: "superadmin" as UserRole,
                    },
                    {
                        title: t("sidebar.auditLogs"),
                        url: "/dashboard/audit-logs",
                        icon: ScrollText,
                        iconColor: "text-orange-400",
                        isActive: pathname.startsWith("/dashboard/audit-logs"),
                        requiredRole: "superadmin" as UserRole,
                    },
                    {
                        title: t("sidebar.permissions"),
                        url: "/dashboard/permissions",
                        icon: Shield,
                        iconColor: "text-rose-400",
                        isActive: pathname.startsWith("/dashboard/permissions"),
                        requiredRole: "superadmin" as UserRole,
                    },
                    {
                        title: t("sidebar.systemHealth"),
                        url: "/dashboard/system-health",
                        icon: Activity,
                        iconColor: "text-teal-400",
                        isActive: pathname.startsWith("/dashboard/system-health"),
                        requiredRole: "superadmin" as UserRole,
                    },
                    {
                        title: t("sidebar.settings"),
                        url: "/dashboard/settings",
                        icon: Settings,
                        iconColor: "text-indigo-400",
                        isActive: pathname.startsWith("/dashboard/settings"),
                        requiredRole: "superadmin" as UserRole,
                    },
                ],
            },
        ]
    }, [t, pathname, locale])

    return (
        <Sidebar
            collapsible="icon"
            side={sidebarSide}
            className="top-[var(--header-height)] h-[calc(100svh-var(--header-height))]!"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {mounted && (
                            <SidebarHeaderContent
                                isRTL={isRTL}
                                brandingText="GoIELTS"
                                adminPortalText={t("branding.adminPortal")}
                            />
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {mounted && navSections.map((section) => {
                    // Filter items based on user role permissions
                    const filteredItems = section.items.filter((item) =>
                        hasRolePermission(user.role, item.requiredRole)
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
                                            <SidebarMenuItemContent
                                                title={item.title}
                                                url={item.url}
                                                icon={item.icon}
                                                iconColor={item.iconColor}
                                                isActive={item.isActive}
                                            />
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                })}
            </SidebarContent>
            <SidebarFooter>
                {mounted && <NavUser user={user} />}
            </SidebarFooter>
        </Sidebar>
    )
}
