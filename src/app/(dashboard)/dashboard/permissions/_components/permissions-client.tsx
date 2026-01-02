"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { RefreshCw, RotateCcw, Save, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { PermissionEditor } from "./permission-editor"
import { IBM_Plex_Sans_Arabic } from "next/font/google"

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
})

interface PermissionSet {
    _id: string
    role: "reviewer" | "admin" | "superadmin"
    displayName: {
        en: string
        ar: string
    }
    description: {
        en: string
        ar: string
    }
    permissions: string[]
    isCustom: boolean
    isActive: boolean
}

interface PermissionMetadata {
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

export function PermissionsClient() {
    const { t, locale, isRTL } = useTranslate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<string>("reviewer")
    const [permissionSets, setPermissionSets] = useState<PermissionSet[]>([])
    const [metadata, setMetadata] = useState<PermissionMetadata | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [setsResponse, metadataResponse] = await Promise.all([
                fetch("/api/permissions"),
                fetch("/api/permissions/metadata"),
            ])

            if (!setsResponse.ok) {
                throw new Error(`HTTP error! status: ${setsResponse.status}`)
            }

            if (!metadataResponse.ok) {
                throw new Error(`HTTP error! status: ${metadataResponse.status}`)
            }

            const setsData = await setsResponse.json()
            const metadataData = await metadataResponse.json()

            if (setsData.success) {
                setPermissionSets(setsData.data)
            }

            if (metadataData.success) {
                setMetadata(metadataData.data)
            }
        } catch (error) {
            console.error("Failed to fetch permissions:", error)
            toast.error(t("common.error"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handlePermissionsChange = (role: string, newPermissions: string[]) => {
        setPermissionSets((prev) =>
            prev.map((set) =>
                set.role === role ? { ...set, permissions: newPermissions } : set
            )
        )
        setHasChanges(true)
    }

    const handleSave = async (role: string) => {
        const permissionSet = permissionSets.find((set) => set.role === role)
        if (!permissionSet) return

        setSaving(true)
        try {
            const response = await fetch(`/api/permissions/${role}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    permissions: permissionSet.permissions,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(locale === "ar" ? "تم حفظ الصلاحيات بنجاح" : "Permissions saved successfully")
                setHasChanges(false)
                await fetchData()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to save permissions:", error)
            toast.error(t("common.error"))
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async (role: string) => {
        if (
            !confirm(
                locale === "ar"
                    ? "هل أنت متأكد من إعادة تعيين الصلاحيات إلى الإعدادات الافتراضية؟"
                    : "Are you sure you want to reset permissions to defaults?"
            )
        ) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/permissions/${role}/reset`, {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                toast.success(locale === "ar" ? "تمت إعادة التعيين بنجاح" : "Permissions reset successfully")
                setHasChanges(false)
                await fetchData()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Failed to reset permissions:", error)
            toast.error(t("common.error"))
        } finally {
            setSaving(false)
        }
    }

    const currentPermissionSet = permissionSets.find((set) => set.role === activeTab)

    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title={locale === "ar" ? "إدارة الصلاحيات" : "Permissions Management"}
                    subtitle={locale === "ar"
                        ? "قم بتخصيص صلاحيات كل دور في النظام"
                        : "Customize permissions for each role in the system"}
                    className="px-0 pt-0 pb-0"
                    iconSize="h-8 w-8"
                />
                <Button
                    variant="outline"
                    onClick={fetchData}
                    disabled={loading}
                    className={cn(locale === "ar" && ibmPlexArabic.className)}
                >
                    <RefreshCw className={cn("h-4 w-4 me-2", loading && "animate-spin")} />
                    {t("common.refresh")}
                </Button>
            </div>

            {/* Warning Banner */}
            {hasChanges && (
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <p className={cn("text-yellow-800 dark:text-yellow-200", locale === "ar" && ibmPlexArabic.className)}>
                                {locale === "ar"
                                    ? "لديك تغييرات غير محفوظة. تأكد من حفظ التغييرات قبل المغادرة."
                                    : "You have unsaved changes. Make sure to save before leaving."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Spinner className="h-8 w-8 text-primary" />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className={cn(locale === "ar" && ibmPlexArabic.className)}>
                            {locale === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions"}
                        </CardTitle>
                        <CardDescription className={cn(locale === "ar" && ibmPlexArabic.className)}>
                            {locale === "ar"
                                ? "حدد الصلاحيات المتاحة لكل دور. لا يمكن تعديل صلاحيات المدير العام."
                                : "Define what each role can access. Superadmin permissions cannot be modified."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-3 w-full h-14 p-1 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 rounded-lg border border-border/50">
                                {permissionSets.map((set) => (
                                    <TabsTrigger
                                        key={set.role}
                                        value={set.role}
                                        className="data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                                    >
                                        <div className={cn("flex items-center gap-2", locale === "ar" && ibmPlexArabic.className)}>
                                            {locale === "ar" ? set.displayName.ar : set.displayName.en}
                                            {set.isCustom && (
                                                <Badge variant="secondary" className={cn("text-xs", locale === "ar" && ibmPlexArabic.className)}>
                                                    {locale === "ar" ? "مخصص" : "Custom"}
                                                </Badge>
                                            )}
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {permissionSets.map((set) => (
                                <TabsContent key={set.role} value={set.role} className="space-y-4 mt-6" dir={locale === "ar" ? "rtl" : "ltr"}>
                                    <div className="flex items-center justify-between">
                                        <div dir={locale === "ar" ? "rtl" : "ltr"}>
                                            <h3 className={cn("text-lg font-semibold", locale === "ar" && ibmPlexArabic.className)}>
                                                {locale === "ar" ? set.displayName.ar : set.displayName.en}
                                            </h3>
                                            <p className={cn("text-sm text-muted-foreground", locale === "ar" && ibmPlexArabic.className)}>
                                                {locale === "ar" ? set.description.ar : set.description.en}
                                            </p>
                                        </div>
                                        {set.role !== "superadmin" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleReset(set.role)}
                                                    disabled={saving || !set.isCustom}
                                                >
                                                    <span className={cn("flex items-center", locale === "ar" && ibmPlexArabic.className)} dir={locale === "ar" ? "rtl" : "ltr"}>
                                                        <RotateCcw className="h-4 w-4 me-2" />
                                                        {locale === "ar" ? "إعادة تعيين" : "Reset"}
                                                    </span>
                                                </Button>
                                                <Button
                                                    onClick={() => handleSave(set.role)}
                                                    disabled={saving || !hasChanges}
                                                >
                                                    <span className={cn("flex items-center", locale === "ar" && ibmPlexArabic.className)} dir={locale === "ar" ? "rtl" : "ltr"}>
                                                        <Save className="h-4 w-4 me-2" />
                                                        {locale === "ar" ? "حفظ" : "Save"}
                                                    </span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {metadata && (
                                        <PermissionEditor
                                            role={set.role}
                                            permissions={set.permissions}
                                            metadata={metadata}
                                            onChange={(newPermissions) =>
                                                handlePermissionsChange(set.role, newPermissions)
                                            }
                                            disabled={set.role === "superadmin" || saving}
                                        />
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
