"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Shield, RefreshCw, RotateCcw, Save, AlertTriangle } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { PermissionEditor } from "./permission-editor"

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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        {locale === "ar" ? "إدارة الصلاحيات" : "Permissions Management"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === "ar"
                            ? "قم بتخصيص صلاحيات كل دور في النظام"
                            : "Customize permissions for each role in the system"}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchData}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2", loading && "animate-spin")} />
                    {t("common.refresh")}
                </Button>
            </div>

            {/* Warning Banner */}
            {hasChanges && (
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-yellow-800 dark:text-yellow-200">
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
                        <CardTitle>
                            {locale === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions"}
                        </CardTitle>
                        <CardDescription>
                            {locale === "ar"
                                ? "حدد الصلاحيات المتاحة لكل دور. لا يمكن تعديل صلاحيات المدير العام."
                                : "Define what each role can access. Superadmin permissions cannot be modified."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-3 w-full">
                                {permissionSets.map((set) => (
                                    <TabsTrigger key={set.role} value={set.role}>
                                        <div className="flex items-center gap-2">
                                            {locale === "ar" ? set.displayName.ar : set.displayName.en}
                                            {set.isCustom && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {locale === "ar" ? "مخصص" : "Custom"}
                                                </Badge>
                                            )}
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {permissionSets.map((set) => (
                                <TabsContent key={set.role} value={set.role} className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {locale === "ar" ? set.displayName.ar : set.displayName.en}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
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
                                                    <RotateCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                    {locale === "ar" ? "إعادة تعيين" : "Reset"}
                                                </Button>
                                                <Button
                                                    onClick={() => handleSave(set.role)}
                                                    disabled={saving || !hasChanges}
                                                >
                                                    <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                                    {locale === "ar" ? "حفظ" : "Save"}
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
