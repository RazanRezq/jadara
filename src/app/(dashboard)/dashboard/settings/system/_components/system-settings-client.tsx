"use client"

import { useState, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Settings, Mail, Brain, Shield, Database, Bell, ToggleLeft } from "lucide-react"

import { EmailSettings } from "./tabs/email-settings"
import { AISettings } from "./tabs/ai-settings"
import { ApplicationSettings } from "./tabs/application-settings"
import { SecuritySettings } from "./tabs/security-settings"
import { StorageSettings } from "./tabs/storage-settings"
import { NotificationSettings } from "./tabs/notification-settings"
import { FeatureFlags } from "./tabs/feature-flags"

export function SystemSettingsClient() {
    const { t, dir } = useTranslate()
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("email")

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/system-config")

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
            } else {
                toast.error(t("settings.system.failedToLoad"))
            }
        } catch (error) {
            console.error("Error loading system config:", error)
            toast.error(t("settings.system.failedToLoad"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    const handleSave = async (section: string, data: any) => {
        try {
            setSaving(true)

            const updates = {
                ...config,
                [section]: {
                    ...config[section],
                    ...data,
                },
            }

            const response = await fetch("/api/system-config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
                toast.success(t("settings.system.configResetSuccess"))
            } else {
                toast.error(result.error || t("settings.system.configResetError"))
            }
        } catch (error) {
            console.error("Error saving config:", error)
            toast.error(t("settings.system.configResetError"))
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        if (!confirm(t("settings.system.resetConfirm"))) {
            return
        }

        try {
            setSaving(true)
            const response = await fetch("/api/system-config/reset", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
                toast.success(t("settings.system.configResetSuccess"))
            } else {
                toast.error(result.error || t("settings.system.configResetError"))
            }
        } catch (error) {
            console.error("Error resetting config:", error)
            toast.error(t("settings.system.configResetError"))
        } finally {
            setSaving(false)
        }
    }

    // Define tabs - flexbox with dir="rtl" handles ordering automatically
    const tabs = [
        { value: "email", icon: Mail, labelKey: "settings.system.tabs.email" },
        { value: "ai", icon: Brain, labelKey: "settings.system.tabs.ai" },
        { value: "application", icon: Settings, labelKey: "settings.system.tabs.application" },
        { value: "security", icon: Shield, labelKey: "settings.system.tabs.security" },
        { value: "storage", icon: Database, labelKey: "settings.system.tabs.storage" },
        { value: "notifications", icon: Bell, labelKey: "settings.system.tabs.notifications" },
        { value: "features", icon: ToggleLeft, labelKey: "settings.system.tabs.features" },
    ]

    if (loading) {
        return (
            <div className="dashboard-container flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!config) {
        return (
            <div className="dashboard-container text-center py-12" dir={dir}>
                <p className="text-muted-foreground">{t("settings.system.failedToLoad")}</p>
                <Button onClick={fetchConfig} className="mt-4">
                    {t("settings.system.retry")}
                </Button>
            </div>
        )
    }

    return (
        <div className="dashboard-container space-y-6" dir={dir}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="text-start">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        {t("settings.system.systemConfiguration")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("settings.system.manageSystemWide")}
                    </p>
                </div>
                <Button variant="destructive" onClick={handleReset} disabled={saving}>
                    {t("settings.system.resetToDefaults")}
                </Button>
            </div>

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={dir}>
                <TabsList className="flex w-full">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <tab.icon className="h-4 w-4" />
                            {t(tab.labelKey)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="email">
                    <EmailSettings
                        config={config.email}
                        onSave={(data: any) => handleSave("email", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="ai">
                    <AISettings
                        config={config.ai}
                        onSave={(data: any) => handleSave("ai", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="application">
                    <ApplicationSettings
                        config={config.application}
                        onSave={(data: any) => handleSave("application", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="security">
                    <SecuritySettings
                        config={config.security}
                        onSave={(data: any) => handleSave("security", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="storage">
                    <StorageSettings
                        config={config.storage}
                        onSave={(data: any) => handleSave("storage", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings
                        config={config.notifications}
                        onSave={(data: any) => handleSave("notifications", data)}
                        saving={saving}
                    />
                </TabsContent>

                <TabsContent value="features">
                    <FeatureFlags
                        config={config.features}
                        onSave={(data: any) => handleSave("features", data)}
                        saving={saving}
                    />
                </TabsContent>
            </Tabs>

            {/* Last Updated Info */}
            {config.lastUpdatedBy && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground text-start">
                            {t("settings.system.lastUpdatedBy")} {config.lastUpdatedBy.name} ({config.lastUpdatedBy.email})
                            {config.updatedAt && ` ${t("settings.system.on")} ${new Date(config.updatedAt).toLocaleString()}`}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
