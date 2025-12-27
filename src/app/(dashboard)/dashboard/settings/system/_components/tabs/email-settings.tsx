"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Mail, Send } from "lucide-react"
import { toast } from "sonner"
import { useTranslate } from "@/hooks/useTranslate"

interface EmailSettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function EmailSettings({ config, onSave, saving }: EmailSettingsProps) {
    const { t, dir } = useTranslate()
    const [formData, setFormData] = useState(config || {})
    const [testing, setTesting] = useState(false)

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSave(formData)
    }

    const handleTest = async () => {
        const testEmail = prompt(t("settings.system.email.testEmailPrompt"))
        if (!testEmail) return

        try {
            setTesting(true)
            const response = await fetch("/api/system-config/test-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testEmail }),
            })

            const result = await response.json()

            if (result.success) {
                toast.success(t("settings.system.email.testEmailSuccess"))
            } else {
                toast.error(result.error || t("settings.system.email.testEmailError"))
            }
        } catch (error) {
            toast.error(t("settings.system.email.testEmailErrorSending"))
        } finally {
            setTesting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir={dir}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {t("settings.system.email.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.email.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Enable/Disable Email */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 text-start">
                            <Label>{t("settings.system.email.enableService")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.system.email.enableDescription")}
                            </p>
                        </div>
                        <Switch
                            checked={formData.enabled}
                            onCheckedChange={(checked) => handleChange("enabled", checked)}
                        />
                    </div>

                    {/* Email Provider */}
                    <div className="space-y-2 text-start">
                        <Label htmlFor="provider">{t("settings.system.email.provider")}</Label>
                        <Select
                            value={formData.provider}
                            onValueChange={(value) => handleChange("provider", value)}
                            dir={dir}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("settings.system.email.selectProvider")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="resend">Resend</SelectItem>
                                <SelectItem value="sendgrid">SendGrid</SelectItem>
                                <SelectItem value="aws-ses">AWS SES</SelectItem>
                                <SelectItem value="smtp">SMTP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* API Key (for non-SMTP providers) */}
                    {formData.provider !== "smtp" && (
                        <div className="space-y-2 text-start">
                            <Label htmlFor="apiKey">{t("settings.system.email.apiKey")}</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={formData.apiKey || ""}
                                onChange={(e) => handleChange("apiKey", e.target.value)}
                                placeholder={t("settings.system.email.apiKeyPlaceholder")}
                                dir="ltr"
                            />
                        </div>
                    )}

                    {/* SMTP Configuration */}
                    {formData.provider === "smtp" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="smtpHost">{t("settings.system.email.smtpHost")}</Label>
                                    <Input
                                        id="smtpHost"
                                        value={formData.smtpHost || ""}
                                        onChange={(e) => handleChange("smtpHost", e.target.value)}
                                        placeholder={t("settings.system.email.smtpHostPlaceholder")}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="smtpPort">{t("settings.system.email.smtpPort")}</Label>
                                    <Input
                                        id="smtpPort"
                                        type="number"
                                        value={formData.smtpPort || 587}
                                        onChange={(e) => handleChange("smtpPort", parseInt(e.target.value))}
                                        placeholder={t("settings.system.email.smtpPortPlaceholder")}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="smtpUser">{t("settings.system.email.smtpUsername")}</Label>
                                    <Input
                                        id="smtpUser"
                                        value={formData.smtpUser || ""}
                                        onChange={(e) => handleChange("smtpUser", e.target.value)}
                                        placeholder={t("settings.system.email.smtpUsernamePlaceholder")}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2 text-start">
                                    <Label htmlFor="smtpPassword">{t("settings.system.email.smtpPassword")}</Label>
                                    <Input
                                        id="smtpPassword"
                                        type="password"
                                        value={formData.smtpPassword || ""}
                                        onChange={(e) => handleChange("smtpPassword", e.target.value)}
                                        placeholder={t("settings.system.email.smtpPasswordPlaceholder")}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* From Email */}
                    <div className="space-y-2 text-start">
                        <Label htmlFor="fromEmail">{t("settings.system.email.fromEmail")}</Label>
                        <Input
                            id="fromEmail"
                            type="email"
                            value={formData.fromEmail || ""}
                            onChange={(e) => handleChange("fromEmail", e.target.value)}
                            placeholder={t("settings.system.email.fromEmailPlaceholder")}
                            dir="ltr"
                            required
                        />
                    </div>

                    {/* From Name */}
                    <div className="space-y-2 text-start">
                        <Label htmlFor="fromName">{t("settings.system.email.fromName")}</Label>
                        <Input
                            id="fromName"
                            value={formData.fromName || ""}
                            onChange={(e) => handleChange("fromName", e.target.value)}
                            placeholder={t("settings.system.email.fromNamePlaceholder")}
                            required
                        />
                    </div>

                    {/* Reply To */}
                    <div className="space-y-2 text-start">
                        <Label htmlFor="replyTo">{t("settings.system.email.replyTo")}</Label>
                        <Input
                            id="replyTo"
                            type="email"
                            value={formData.replyTo || ""}
                            onChange={(e) => handleChange("replyTo", e.target.value)}
                            placeholder={t("settings.system.email.replyToPlaceholder")}
                            dir="ltr"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={!formData.enabled || testing}
                >
                    <Send className="h-4 w-4 me-2" />
                    {testing ? t("settings.system.email.sending") : t("settings.system.email.sendTestEmail")}
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.email.saving") : t("settings.system.email.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
