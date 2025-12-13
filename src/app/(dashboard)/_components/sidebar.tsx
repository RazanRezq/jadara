"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getRoleColor, hasPermission, type SessionPayload, type UserRole } from "@/lib/auth"
import { useTranslate } from "@/hooks/useTranslate"
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    BookOpen,
    BarChart3,
    MessageSquare,
    Shield,
} from "lucide-react"

interface NavItem {
    titleKey: string
    href: string
    icon: React.ElementType
    requiredRole: UserRole
}

const navItems: NavItem[] = [
    {
        titleKey: "sidebar.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiredRole: "reviewer",
    },
    {
        titleKey: "sidebar.content",
        href: "/dashboard/content",
        icon: FileText,
        requiredRole: "reviewer",
    },
    {
        titleKey: "sidebar.reviews",
        href: "/dashboard/reviews",
        icon: MessageSquare,
        requiredRole: "reviewer",
    },
    {
        titleKey: "sidebar.analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        requiredRole: "admin",
    },
    {
        titleKey: "sidebar.users",
        href: "/dashboard/users",
        icon: Users,
        requiredRole: "admin",
    },
    {
        titleKey: "sidebar.roles",
        href: "/dashboard/roles",
        icon: Shield,
        requiredRole: "superadmin",
    },
    {
        titleKey: "sidebar.settings",
        href: "/dashboard/settings",
        icon: Settings,
        requiredRole: "superadmin",
    },
]

interface DashboardSidebarProps {
    user: SessionPayload
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
    const pathname = usePathname()
    const { t, isRTL } = useTranslate()

    const filteredNavItems = navItems.filter((item) =>
        hasPermission(user.role, item.requiredRole)
    )

    return (
        <aside className={cn(
            "fixed inset-y-0 z-50 hidden w-72 border-white/5 bg-[#0f0f14] lg:flex lg:flex-col",
            isRTL ? "right-0 border-l" : "left-0 border-r"
        )}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    GoIELTS
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="space-y-1.5">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-400 border border-cyan-500/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5",
                                        isActive && "text-cyan-400"
                                    )} />
                                    {t(item.titleKey)}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User info */}
            <div className="border-t border-white/5 p-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
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
