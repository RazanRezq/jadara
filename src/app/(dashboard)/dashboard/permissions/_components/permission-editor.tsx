"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Users,
    Briefcase,
    UserCheck,
    ClipboardList,
    HelpCircle,
    Building2,
    Settings,
    ScrollText,
    Bell,
} from "lucide-react"
import { IBM_Plex_Sans_Arabic } from "next/font/google"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
})

interface PermissionEditorProps {
    role: string
    permissions: string[]
    metadata: {
        categories: {
            en: Record<string, string>
            ar: Record<string, string>
        }
        permissions: Record<
            string,
            {
                en: string
                ar: string
                category: string
            }
        >
    }
    onChange: (permissions: string[]) => void
    disabled?: boolean
}

const categoryIcons: Record<string, any> = {
    users: Users,
    jobs: Briefcase,
    applicants: UserCheck,
    evaluations: ClipboardList,
    questions: HelpCircle,
    company: Building2,
    system: Settings,
    audit: ScrollText,
    notifications: Bell,
}

export function PermissionEditor({
    role,
    permissions,
    metadata,
    onChange,
    disabled = false,
}: PermissionEditorProps) {
    const { locale, isRTL } = useTranslate()

    // Group permissions by category
    const permissionsByCategory = Object.entries(metadata.permissions).reduce(
        (acc, [key, value]) => {
            const category = value.category
            if (!acc[category]) {
                acc[category] = []
            }
            acc[category].push(key)
            return acc
        },
        {} as Record<string, string[]>
    )

    const handleToggle = (permission: string) => {
        if (disabled) return

        const newPermissions = permissions.includes(permission)
            ? permissions.filter((p) => p !== permission)
            : [...permissions, permission]

        onChange(newPermissions)
    }

    const handleToggleCategory = (category: string) => {
        if (disabled) return

        const categoryPermissions = permissionsByCategory[category] || []
        const allSelected = categoryPermissions.every((p) => permissions.includes(p))

        let newPermissions: string[]
        if (allSelected) {
            // Deselect all in category
            newPermissions = permissions.filter((p) => !categoryPermissions.includes(p))
        } else {
            // Select all in category
            const toAdd = categoryPermissions.filter((p) => !permissions.includes(p))
            newPermissions = [...permissions, ...toAdd]
        }

        onChange(newPermissions)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                const Icon = categoryIcons[category] || Settings
                const categoryName =
                    locale === "ar"
                        ? metadata.categories.ar[category]
                        : metadata.categories.en[category]

                const allSelected = categoryPermissions.every((p) => permissions.includes(p))
                const someSelected = categoryPermissions.some((p) => permissions.includes(p))

                return (
                    <Card key={category} dir={locale === "ar" ? "rtl" : "ltr"}>
                        <CardHeader className="border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className={cn("text-sm font-medium flex items-center gap-2", locale === "ar" && ibmPlexArabic.className)}>
                                    <Icon className="h-4 w-4 text-primary" />
                                    {categoryName}
                                </CardTitle>
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={() => handleToggleCategory(category)}
                                    disabled={disabled}
                                    className={cn(
                                        someSelected && !allSelected && "data-[state=checked]:bg-primary/50"
                                    )}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {categoryPermissions.map((permission) => {
                                const permissionData = metadata.permissions[permission]
                                const label =
                                    locale === "ar" ? permissionData.ar : permissionData.en

                                return (
                                    <div
                                        key={permission}
                                        className="flex items-start gap-3 group"
                                    >
                                        <Checkbox
                                            id={`${role}-${permission}`}
                                            checked={permissions.includes(permission)}
                                            onCheckedChange={() => handleToggle(permission)}
                                            disabled={disabled}
                                            className="mt-0.5"
                                        />
                                        <Label
                                            htmlFor={`${role}-${permission}`}
                                            className={cn(
                                                "text-sm leading-tight cursor-pointer",
                                                disabled && "cursor-not-allowed opacity-50",
                                                !disabled && "group-hover:text-primary",
                                                locale === "ar" && ibmPlexArabic.className
                                            )}
                                        >
                                            {label}
                                        </Label>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
