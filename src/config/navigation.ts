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
// Icons use foreground color for consistency (no random colors)
export const navigationConfig: NavigationItem[] = [
    {
        titleKey: "sidebar.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        iconColor: "text-foreground",
    },
    {
        titleKey: "sidebar.jobs",
        href: "/dashboard/jobs",
        icon: Briefcase,
        iconColor: "text-foreground",
        requiredPermission: "jobs.view",
    },
    {
        titleKey: "sidebar.candidates",
        href: "/dashboard/applicants",
        icon: UserCheck,
        iconColor: "text-foreground",
        requiredPermission: "applicants.view",
    },
    {
        titleKey: "sidebar.calendar",
        href: "/dashboard/calendar",
        icon: Calendar,
        iconColor: "text-foreground",
        requiredPermission: "jobs.create",
    },
    {
        titleKey: "sidebar.questionBank",
        href: "/dashboard/questions",
        icon: HelpCircle,
        iconColor: "text-foreground",
        requiredPermission: "questions.view",
    },
    {
        titleKey: "sidebar.scorecards",
        href: "/dashboard/scorecards",
        icon: ClipboardList,
        iconColor: "text-foreground",
        requiredPermission: "evaluations.create",
    },
    {
        titleKey: "sidebar.team",
        href: "/dashboard/users",
        icon: Users,
        iconColor: "text-foreground",
        requiredPermission: "users.view",
    },
    {
        titleKey: "notifications.page.title",
        href: "/dashboard/notifications",
        icon: Bell,
        iconColor: "text-foreground",
    },
    {
        titleKey: "sessions.title",
        href: "/dashboard/sessions",
        icon: Activity,
        iconColor: "text-foreground",
    },
    {
        titleKey: "auditLogs.title",
        href: "/dashboard/audit-logs",
        icon: FileText,
        iconColor: "text-foreground",
    },
    {
        titleKey: "settings.title",
        href: "/dashboard/settings",
        icon: Settings,
        iconColor: "text-foreground",
    },
    {
        titleKey: "settings.company.title",
        href: "/dashboard/settings/company",
        icon: Building2,
        iconColor: "text-foreground",
    },
    {
        titleKey: "settings.system.systemConfiguration",
        href: "/dashboard/settings/system",
        icon: Settings,
        iconColor: "text-foreground",
    },
    {
        titleKey: "Permissions Management",
        href: "/dashboard/permissions",
        icon: Shield,
        iconColor: "text-foreground",
    },
    {
        titleKey: "System Health Monitoring",
        href: "/dashboard/system-health",
        icon: Activity,
        iconColor: "text-foreground",
    },
    // Special dashboard views (role-specific)
    {
        titleKey: "dashboard.admin.title",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
        iconColor: "text-foreground",
    },
    {
        titleKey: "dashboard.superAdmin.title",
        href: "/dashboard/superadmin",
        icon: Shield,
        iconColor: "text-foreground",
    },
    {
        titleKey: "dashboard.reviewer.welcome",
        href: "/dashboard/reviewer",
        icon: ClipboardCheck,
        iconColor: "text-foreground",
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
