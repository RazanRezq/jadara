"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"

interface NotificationSettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function NotificationSettings({ config, onSave, saving }: NotificationSettingsProps) {
    const { t, dir } = useTranslate()
    const [formData, setFormData] = useState(config || {})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSave(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir={dir}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t("settings.system.notifications.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.notifications.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Enable Notifications */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.notifications.enableNotifications")}</Label>
                        <Switch
                            checked={formData.enabled}
                            onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
                        />
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.notifications.emailNotifications")}</Label>
                        <Switch
                            checked={formData.emailNotifications}
                            onCheckedChange={(c) => setFormData({ ...formData, emailNotifications: c })}
                        />
                    </div>

                    {/* In-App Notifications */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.notifications.inAppNotifications")}</Label>
                        <Switch
                            checked={formData.inAppNotifications}
                            onCheckedChange={(c) => setFormData({ ...formData, inAppNotifications: c })}
                        />
                    </div>

                    {/* Slack Webhook */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.notifications.slackWebhook")}</Label>
                        <Input
                            value={formData.slackWebhook || ""}
                            onChange={(e) => setFormData({ ...formData, slackWebhook: e.target.value })}
                            placeholder={t("settings.system.notifications.slackPlaceholder")}
                            dir="ltr"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.notifications.saving") : t("settings.system.notifications.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
