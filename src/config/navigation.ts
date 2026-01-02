import {
    LayoutDashboard,
    Briefcase,
    UserCheck,
    Calendar,
    HelpCircle,
    ClipboardList,
    Users,
    Bell,
    Activity,
    FileText,
    Settings,
    Building2,
    Shield,
    ClipboardCheck,
    type LucideIcon,
} from "lucide-react"

export interface NavigationItem {
    titleKey: string
    href: string
    icon: LucideIcon
    iconColor: string
    iconColorDark?: string
    requiredPermission?: string
}

// Centralized navigation configuration
// This is the single source of truth for all icons and colors
export const navigationConfig: NavigationItem[] = [
    {
        titleKey: "sidebar.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        iconColor: "text-violet-600",
        iconColorDark: "dark:text-violet-500",
    },
    {
        titleKey: "sidebar.jobs",
        href: "/dashboard/jobs",
        icon: Briefcase,
        iconColor: "text-purple-600",
        iconColorDark: "dark:text-purple-500",
        requiredPermission: "jobs.view",
    },
    {
        titleKey: "sidebar.candidates",
        href: "/dashboard/applicants",
        icon: UserCheck,
        iconColor: "text-blue-600",
        iconColorDark: "dark:text-blue-500",
        requiredPermission: "applicants.view",
    },
    {
        titleKey: "sidebar.calendar",
        href: "/dashboard/calendar",
        icon: Calendar,
        iconColor: "text-sky-600",
        iconColorDark: "dark:text-sky-500",
        requiredPermission: "jobs.create",
    },
    {
        titleKey: "sidebar.questionBank",
        href: "/dashboard/questions",
        icon: HelpCircle,
        iconColor: "text-orange-600",
        iconColorDark: "dark:text-orange-500",
        requiredPermission: "questions.view",
    },
    {
        titleKey: "sidebar.scorecards",
        href: "/dashboard/scorecards",
        icon: ClipboardList,
        iconColor: "text-green-600",
        iconColorDark: "dark:text-green-500",
        requiredPermission: "evaluations.create",
    },
    {
        titleKey: "sidebar.team",
        href: "/dashboard/users",
        icon: Users,
        iconColor: "text-emerald-600",
        iconColorDark: "dark:text-emerald-500",
        requiredPermission: "users.view",
    },
    {
        titleKey: "notifications.page.title",
        href: "/dashboard/notifications",
        icon: Bell,
        iconColor: "text-amber-600",
        iconColorDark: "dark:text-amber-500",
    },
    {
        titleKey: "sessions.title",
        href: "/dashboard/sessions",
        icon: Activity,
        iconColor: "text-rose-600",
        iconColorDark: "dark:text-rose-500",
    },
    {
        titleKey: "auditLogs.title",
        href: "/dashboard/audit-logs",
        icon: FileText,
        iconColor: "text-slate-600",
        iconColorDark: "dark:text-slate-400",
    },
    {
        titleKey: "settings.title",
        href: "/dashboard/settings",
        icon: Settings,
        iconColor: "text-gray-600",
        iconColorDark: "dark:text-gray-400",
    },
    {
        titleKey: "settings.company.title",
        href: "/dashboard/settings/company",
        icon: Building2,
        iconColor: "text-cyan-600",
        iconColorDark: "dark:text-cyan-500",
    },
    {
        titleKey: "settings.system.systemConfiguration",
        href: "/dashboard/settings/system",
        icon: Settings,
        iconColor: "text-gray-600",
        iconColorDark: "dark:text-gray-400",
    },
    {
        titleKey: "Permissions Management",
        href: "/dashboard/permissions",
        icon: Shield,
        iconColor: "text-purple-600",
        iconColorDark: "dark:text-purple-500",
    },
    {
        titleKey: "System Health Monitoring",
        href: "/dashboard/system-health",
        icon: Activity,
        iconColor: "text-green-600",
        iconColorDark: "dark:text-green-500",
    },
    // Special dashboard views (role-specific)
    {
        titleKey: "dashboard.admin.title",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
        iconColor: "text-violet-600",
        iconColorDark: "dark:text-violet-500",
    },
    {
        titleKey: "dashboard.superAdmin.title",
        href: "/dashboard/superadmin",
        icon: Shield,
        iconColor: "text-red-600",
        iconColorDark: "dark:text-red-500",
    },
    {
        titleKey: "dashboard.reviewer.welcome",
        href: "/dashboard/reviewer",
        icon: ClipboardCheck,
        iconColor: "text-indigo-600",
        iconColorDark: "dark:text-indigo-500",
    },
]

// Helper function to get navigation item by route
export function getNavigationByRoute(pathname: string): NavigationItem | undefined {
    // Try exact match first
    const exactMatch = navigationConfig.find(item => item.href === pathname)
    if (exactMatch) return exactMatch

    // Try to find the closest parent route
    // Sort by href length (descending) to match most specific route first
    const sorted = [...navigationConfig].sort((a, b) => b.href.length - a.href.length)
    return sorted.find(item => pathname.startsWith(item.href))
}

// Helper to get full icon color class string
export function getIconColorClass(item: NavigationItem): string {
    return `${item.iconColor} ${item.iconColorDark || ''}`
}
