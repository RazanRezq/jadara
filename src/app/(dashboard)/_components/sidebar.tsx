"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { type SessionPayload } from "@/lib/auth"
import { hasGranularPermission, getRoleColor } from "@/lib/authClient"
import { useTranslate } from "@/hooks/useTranslate"
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Briefcase,
    Calendar,
    HelpCircle,
    ClipboardList,
    UsersRound,
} from "lucide-react"

interface NavItem {
    titleKey: string
    href: string
    icon: React.ElementType
    requiredPermission?: string // Granular permission (optional - some items always visible)
}

const navItems: NavItem[] = [
    {
        titleKey: "sidebar.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        // Dashboard always visible to all authenticated users
    },
    {
        titleKey: "sidebar.jobs",
        href: "/dashboard/jobs",
        icon: Briefcase,
        requiredPermission: "jobs.view",
    },
    {
        titleKey: "sidebar.candidates",
        href: "/dashboard/applicants",
        icon: Users,
        requiredPermission: "applicants.view",
    },
    {
        titleKey: "sidebar.calendar",
        href: "/dashboard/calendar",
        icon: Calendar,
        requiredPermission: "jobs.create", // Calendar is for admins who can create jobs
    },
    {
        titleKey: "sidebar.questionBank",
        href: "/dashboard/questions",
        icon: HelpCircle,
        requiredPermission: "questions.view",
    },
    {
        titleKey: "sidebar.scorecards",
        href: "/dashboard/scorecards",
        icon: ClipboardList,
        requiredPermission: "evaluations.create", // Scorecards for those who can evaluate
    },
    {
        titleKey: "sidebar.team",
        href: "/dashboard/team",
        icon: UsersRound,
        requiredPermission: "users.view",
    },
]

interface DashboardSidebarProps {
    user: SessionPayload
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
    const pathname = usePathname()
    const { t, isRTL } = useTranslate()

    // Filter nav items based on granular permissions
    const filteredNavItems = navItems.filter((item) => {
        // If no permission required, always show
        if (!item.requiredPermission) {
            return true
        }
        // Check granular permission synchronously using default permission sets
        return hasGranularPermission(user.role, item.requiredPermission)
    })

    return (
        <aside className={cn(
            "fixed inset-y-0 z-50 hidden w-72 border-r border-gray-200 bg-white lg:flex lg:flex-col",
            isRTL ? "right-0 border-l" : "left-0 border-r"
        )}>
            {/* Logo */}
            <div className={cn(
                "flex items-center gap-3 border-b border-gray-200 px-6 py-4",
                isRTL ? "flex-row-reverse" : ""
            )}>
                <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-green-600">
                        GoIELTS
                    </span>
                    <span className="text-xs text-gray-500">
                        {t("branding.adminPortal")}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <h3 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("sidebar.navigation")}
                </h3>
                <ul className="space-y-1">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                                        isRTL ? "flex-row-reverse" : "",
                                        isActive
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5",
                                        isActive ? "text-gray-900" : "text-gray-500"
                                    )} />
                                    {t(item.titleKey)}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User info */}
            <div className="border-t border-gray-200 p-4">
                <div className={cn(
                    "flex items-center gap-3 rounded-lg bg-gray-50 p-3",
                    isRTL ? "flex-row-reverse" : ""
                )}>
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                        </p>
                        <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium mt-1",
                            getRoleColor(user.role)
                        )}>
                            {t(`roles.${user.role}`)}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
