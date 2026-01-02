"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"

interface ApplicationSettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function ApplicationSettings({ config, onSave, saving }: ApplicationSettingsProps) {
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
                        <Settings className="h-5 w-5" />
                        {t("settings.system.application.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.application.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Site Name */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.application.siteName")}</Label>
                        <Input
                            value={formData.siteName || ""}
                            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                        />
                    </div>

                    {/* Site URL */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.application.siteUrl")}</Label>
                        <Input
                            value={formData.siteUrl || ""}
                            onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                            dir="ltr"
                        />
                    </div>

                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.application.maintenanceMode")}</Label>
                        <Switch
                            checked={formData.maintenanceMode}
                            onCheckedChange={(c) => setFormData({ ...formData, maintenanceMode: c })}
                        />
                    </div>

                    {/* Default Language */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.application.defaultLanguage")}</Label>
                        <Select
                            value={formData.defaultLanguage}
                            onValueChange={(v) => setFormData({ ...formData, defaultLanguage: v })}
                            dir={dir}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.application.saving") : t("settings.system.application.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
