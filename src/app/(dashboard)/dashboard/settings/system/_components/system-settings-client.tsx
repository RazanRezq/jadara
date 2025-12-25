"use client"

import { useState, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    const { t } = useTranslate()
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("email")

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/system-config")
            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
            } else {
                toast.error("Failed to load system configuration")
            }
        } catch (error) {
            console.error("Error loading system config:", error)
            toast.error("Error loading system configuration")
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

            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
                toast.success(`${section} settings updated successfully`)
            } else {
                toast.error(result.error || "Failed to update settings")
            }
        } catch (error) {
            console.error("Error saving config:", error)
            toast.error("Error saving configuration")
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all settings to defaults? This cannot be undone.")) {
            return
        }

        try {
            setSaving(true)
            const response = await fetch("/api/system-config/reset", {
                method: "POST",
            })

            const result = await response.json()

            if (result.success) {
                setConfig(result.data)
                toast.success("System configuration reset to defaults")
            } else {
                toast.error(result.error || "Failed to reset settings")
            }
        } catch (error) {
            console.error("Error resetting config:", error)
            toast.error("Error resetting configuration")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!config) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load system configuration</p>
                <Button onClick={fetchConfig} className="mt-4">
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        System Configuration
                    </h1>
                    <p className="text-muted-foreground">
                        Manage system-wide settings and configurations
                    </p>
                </div>
                <Button variant="destructive" onClick={handleReset} disabled={saving}>
                    Reset to Defaults
                </Button>
            </div>

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI
                    </TabsTrigger>
                    <TabsTrigger value="application" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Application
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Storage
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="features" className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4" />
                        Features
                    </TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">
                            Last updated by {config.lastUpdatedBy.name} ({config.lastUpdatedBy.email})
                            {config.updatedAt && ` on ${new Date(config.updatedAt).toLocaleString()}`}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
