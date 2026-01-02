"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useTranslate } from "@/hooks/useTranslate"
import { Save, RefreshCw, Building2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"

import { type UserRole } from "@/lib/auth"
import { hasPermission } from "@/lib/authClient"

interface CompanySettingsClientProps {
    userRole: UserRole
}

const companyProfileSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    industry: z.string().min(1, "Industry is required"),
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    website: z
        .string()
        .refine((val) => !val || z.string().url().safeParse(val).success, {
            message: "Invalid URL format",
        }),
})

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>

export function CompanySettingsClient({ userRole }: CompanySettingsClientProps) {
    const { t } = useTranslate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Both admin and superadmin can edit
    const canEdit = hasPermission(userRole, "admin")

    const form = useForm<CompanyProfileFormValues>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: {
            companyName: "",
            industry: "",
            bio: "",
            website: "",
        },
    })

    // Fetch company profile
    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch("/api/company/profile")

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()

                if (data.success && data.profile) {
                    form.reset({
                        companyName: data.profile.companyName || "",
                        industry: data.profile.industry || "",
                        bio: data.profile.bio || "",
                        website: data.profile.website || "",
                    })
                }
            } catch (error) {
                console.error("Failed to fetch company profile:", error)
                toast.error(t("settings.company.fetchError"))
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [form, t])

    async function onSubmit(data: CompanyProfileFormValues) {
        if (!canEdit) {
            toast.error(t("settings.company.noPermission"))
            return
        }

        console.log("[CompanySettings] Submitting form data:", data)
        console.log("[CompanySettings] User role:", userRole)

        setSaving(true)
        try {
            const requestBody = JSON.stringify(data)
            console.log("[CompanySettings] Request body:", requestBody)
            
            const response = await fetch(`/api/company/profile?userRole=${userRole}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody,
            })

            console.log("[CompanySettings] Response status:", response.status, response.statusText)

            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text()
                console.error("API response not OK:", response.status, errorText)
                let errorData
                try {
                    errorData = JSON.parse(errorText)
                } catch {
                    errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
                }
                toast.error(errorData.error || t("settings.company.saveError"))
                return
            }

            // Parse JSON response
            let result
            try {
                const text = await response.text()
                result = text ? JSON.parse(text) : {}
            } catch (parseError) {
                console.error("Failed to parse JSON response:", parseError)
                toast.error(t("settings.company.saveError") + " (Invalid response)")
                return
            }

            if (result.success) {
                toast.success(t("settings.company.saveSuccess"))
            } else {
                // Show detailed error message
                const errorMessage = result.error || result.details || t("settings.company.saveError")
                console.error("Failed to save company profile:", result)
                toast.error(errorMessage)
            }
        } catch (error) {
            console.error("Failed to save company profile:", error)
            const errorMessage = error instanceof Error ? error.message : t("settings.company.saveError")
            toast.error(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-container flex items-center justify-center py-20">
                <Spinner className="h-8 w-8 text-primary" />
            </div>
        )
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <PageHeader
                titleKey="settings.company.title"
                subtitleKey="settings.company.subtitle"
            />

            {/* Permission Notice */}
            {!canEdit && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <CardContent className="pt-6">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            {t("settings.company.viewOnly")}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>{t("settings.company.profileTitle")}</CardTitle>
                            <CardDescription>
                                {t("settings.company.profileDescription")}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Company Name */}
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.company.companyName")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settings.company.companyNamePlaceholder")}
                                                {...field}
                                                disabled={!canEdit}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Industry */}
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.company.industry")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("settings.company.industryPlaceholder")}
                                                {...field}
                                                disabled={!canEdit}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t("settings.company.industryDescription")}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Website */}
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.company.website")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="url"
                                                placeholder="https://example.com"
                                                {...field}
                                                disabled={!canEdit}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bio */}
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.company.bio")} *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t("settings.company.bioPlaceholder")}
                                                rows={6}
                                                {...field}
                                                disabled={!canEdit}
                                                className="resize-none"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t("settings.company.bioDescription")}
                                        </FormDescription>
                                        <div className="flex items-center justify-between">
                                            <FormMessage />
                                            <span className="text-xs text-muted-foreground">
                                                {field.value?.length || 0}/1000
                                            </span>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* Actions */}
                            {canEdit && (
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
                                    >
                                        {saving ? (
                                            <>
                                                <Spinner className="h-4 w-4 me-2" />
                                                {t("common.saving")}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 me-2" />
                                                {t("common.save")}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => form.reset()}
                                        disabled={saving}
                                    >
                                        <RefreshCw className="h-4 w-4 me-2" />
                                        {t("common.reset")}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

