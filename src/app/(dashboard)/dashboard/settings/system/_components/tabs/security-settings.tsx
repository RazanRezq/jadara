"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"

interface SecuritySettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function SecuritySettings({ config, onSave, saving }: SecuritySettingsProps) {
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
                        <Shield className="h-5 w-5" />
                        {t("settings.system.security.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.security.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Session Timeout */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.security.sessionTimeout")}</Label>
                        <Input
                            type="number"
                            value={formData.sessionTimeout || 10080}
                            onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
                            dir="ltr"
                        />
                    </div>

                    {/* Max Login Attempts */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.security.maxLoginAttempts")}</Label>
                        <Input
                            type="number"
                            value={formData.maxLoginAttempts || 5}
                            onChange={(e) => setFormData({ ...formData, maxLoginAttempts: parseInt(e.target.value) })}
                            dir="ltr"
                        />
                    </div>

                    {/* Password Min Length */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.security.passwordMinLength")}</Label>
                        <Input
                            type="number"
                            value={formData.passwordMinLength || 8}
                            onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) })}
                            dir="ltr"
                        />
                    </div>

                    {/* Require Uppercase */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.security.requireUppercase")}</Label>
                        <Switch
                            checked={formData.passwordRequireUppercase}
                            onCheckedChange={(c) => setFormData({ ...formData, passwordRequireUppercase: c })}
                        />
                    </div>

                    {/* Require Numbers */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.security.requireNumbers")}</Label>
                        <Switch
                            checked={formData.passwordRequireNumbers}
                            onCheckedChange={(c) => setFormData({ ...formData, passwordRequireNumbers: c })}
                        />
                    </div>

                    {/* Require 2FA */}
                    <div className="flex items-center justify-between">
                        <Label>{t("settings.system.security.require2FA")}</Label>
                        <Switch
                            checked={formData.require2FA}
                            onCheckedChange={(c) => setFormData({ ...formData, require2FA: c })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.security.saving") : t("settings.system.security.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
