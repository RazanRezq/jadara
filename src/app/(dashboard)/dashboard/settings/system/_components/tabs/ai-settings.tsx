"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Brain, Zap } from "lucide-react"
import { toast } from "sonner"
import { useTranslate } from "@/hooks/useTranslate"

interface AISettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function AISettings({ config, onSave, saving }: AISettingsProps) {
    const { t, dir } = useTranslate()
    const [formData, setFormData] = useState(config || {})
    const [testing, setTesting] = useState(false)

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSave(formData)
    }

    const handleTest = async () => {
        try {
            setTesting(true)
            const response = await fetch("/api/system-config/test-ai", { method: "POST" })
            const result = await response.json()

            if (result.success) {
                toast.success(`${t("settings.system.ai.testSuccess")} (${result.provider}, ${result.model})`)
            } else {
                toast.error(result.error || t("settings.system.ai.testError"))
            }
        } catch (error) {
            toast.error(t("settings.system.ai.testErrorConfig"))
        } finally {
            setTesting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir={dir}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {t("settings.system.ai.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.ai.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Enable/Disable AI */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 text-start">
                            <Label>{t("settings.system.ai.enableEvaluation")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.system.ai.enableDescription")}
                            </p>
                        </div>
                        <Switch
                            checked={formData.enabled}
                            onCheckedChange={(checked) => handleChange("enabled", checked)}
                        />
                    </div>

                    {/* AI Provider */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.provider")}</Label>
                        <Select value={formData.provider} onValueChange={(value) => handleChange("provider", value)} dir={dir}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google-gemini">Google Gemini</SelectItem>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.apiKey")}</Label>
                        <Input
                            type="password"
                            value={formData.apiKey || ""}
                            onChange={(e) => handleChange("apiKey", e.target.value)}
                            placeholder={t("settings.system.ai.apiKeyPlaceholder")}
                            dir="ltr"
                        />
                    </div>

                    {/* Model */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.model")}</Label>
                        <Input
                            value={formData.model || ""}
                            onChange={(e) => handleChange("model", e.target.value)}
                            placeholder={t("settings.system.ai.modelPlaceholder")}
                            dir="ltr"
                        />
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.temperature")}: {formData.temperature?.toFixed(1) || 0.7}</Label>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[formData.temperature || 0.7]}
                            onValueChange={([value]) => handleChange("temperature", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t("settings.system.ai.temperatureHint")}
                        </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.maxTokens")}</Label>
                        <Input
                            type="number"
                            value={formData.maxTokens || 8000}
                            onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                            dir="ltr"
                        />
                    </div>

                    {/* Fallback Model */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.ai.fallbackModel")}</Label>
                        <Input
                            value={formData.fallbackModel || ""}
                            onChange={(e) => handleChange("fallbackModel", e.target.value)}
                            placeholder={t("settings.system.ai.fallbackModelPlaceholder")}
                            dir="ltr"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleTest} disabled={!formData.enabled || testing}>
                    <Zap className="h-4 w-4 me-2" />
                    {testing ? t("settings.system.ai.testing") : t("settings.system.ai.testConfig")}
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.ai.saving") : t("settings.system.ai.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
