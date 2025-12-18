"use client"

import { useTranslate } from "@/hooks/useTranslate"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Shield, Bell, Globe, Palette, Lock, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { hasPermission, type UserRole } from "@/lib/auth"

interface SettingsClientProps {
    userRole: UserRole
}

export function SettingsClient({ userRole }: SettingsClientProps) {
    const { t, isRTL } = useTranslate()
    const router = useRouter()

    const settingsSections = [
        {
            id: "company",
            titleKey: "settings.company.title",
            descriptionKey: "settings.company.description",
            icon: Building2,
            color: "from-cyan-500 to-teal-500",
            shadowColor: "shadow-cyan-500/20",
            href: "/dashboard/settings/company",
            requiredRole: "admin" as UserRole,
        },
        {
            id: "users",
            titleKey: "settings.users.title",
            descriptionKey: "settings.users.description",
            icon: Users,
            color: "from-indigo-500 to-purple-500",
            shadowColor: "shadow-indigo-500/20",
            href: "/dashboard/users",
            requiredRole: "admin" as UserRole,
        },
        {
            id: "roles",
            titleKey: "settings.roles.title",
            descriptionKey: "settings.roles.description",
            icon: Shield,
            color: "from-amber-500 to-orange-500",
            shadowColor: "shadow-amber-500/20",
            href: "/dashboard/settings/roles",
            requiredRole: "superadmin" as UserRole,
        },
        {
            id: "system",
            titleKey: "settings.system.title",
            descriptionKey: "settings.system.description",
            icon: Database,
            color: "from-rose-500 to-pink-500",
            shadowColor: "shadow-rose-500/20",
            href: "/dashboard/settings/system",
            requiredRole: "superadmin" as UserRole,
        },
        {
            id: "notifications",
            titleKey: "settings.notifications.title",
            descriptionKey: "settings.notifications.description",
            icon: Bell,
            color: "from-emerald-500 to-green-500",
            shadowColor: "shadow-emerald-500/20",
            href: "/dashboard/settings/notifications",
            requiredRole: "reviewer" as UserRole,
        },
        {
            id: "preferences",
            titleKey: "settings.preferences.title",
            descriptionKey: "settings.preferences.description",
            icon: Palette,
            color: "from-violet-500 to-purple-500",
            shadowColor: "shadow-violet-500/20",
            href: "/dashboard/settings/preferences",
            requiredRole: "reviewer" as UserRole,
        },
    ]

    // Filter sections based on user role
    const availableSections = settingsSections.filter((section) =>
        hasPermission(userRole, section.requiredRole)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
                <p className="text-muted-foreground mt-2">{t("settings.description")}</p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSections.map((section) => (
                    <Card
                        key={section.id}
                        className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(section.href)}
                    >
                        <div
                            className={cn(
                                "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity",
                                section.color,
                                isRTL && "left-0 right-auto"
                            )}
                        />
                        <CardHeader className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                                        section.color,
                                        section.shadowColor
                                    )}
                                >
                                    <section.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="mt-4">{t(section.titleKey)}</CardTitle>
                            <CardDescription className="line-clamp-2">
                                {t(section.descriptionKey)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <Button variant="ghost" className="w-full justify-start group-hover:bg-muted">
                                {t("settings.configure")}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Role Info */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        {t("settings.accessLevel")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.currentRole")}{" "}
                        <span className="font-semibold text-foreground">{t(`roles.${userRole}`)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {t("settings.accessDescription")}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}



