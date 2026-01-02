"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ToggleLeft } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"

interface FeatureFlagsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function FeatureFlags({ config, onSave, saving }: FeatureFlagsProps) {
    const { t, dir } = useTranslate()
    const [formData, setFormData] = useState(config || {})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSave(formData)
    }

    const features = [
        {
            key: "enableVoiceRecording",
            labelKey: "settings.system.features.voiceRecording",
            descKey: "settings.system.features.voiceRecordingDesc"
        },
        {
            key: "enableAIEvaluation",
            labelKey: "settings.system.features.aiEvaluation",
            descKey: "settings.system.features.aiEvaluationDesc"
        },
        {
            key: "enableInterviewScheduling",
            labelKey: "settings.system.features.interviewScheduling",
            descKey: "settings.system.features.interviewSchedulingDesc"
        },
        {
            key: "enableOfferManagement",
            labelKey: "settings.system.features.offerManagement",
            descKey: "settings.system.features.offerManagementDesc"
        },
        {
            key: "enableVideoInterviews",
            labelKey: "settings.system.features.videoInterviews",
            descKey: "settings.system.features.videoInterviewsDesc"
        }
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir={dir}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ToggleLeft className="h-5 w-5" />
                        {t("settings.system.features.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.features.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {features.map((feature) => (
                        <div
                            key={feature.key}
                            className="flex items-center justify-between"
                        >
                            <div className="text-start">
                                <Label>{t(feature.labelKey)}</Label>
                                <p className="text-sm text-muted-foreground">{t(feature.descKey)}</p>
                            </div>
                            <Switch
                                checked={formData[feature.key]}
                                onCheckedChange={(c) => setFormData({ ...formData, [feature.key]: c })}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.features.saving") : t("settings.system.features.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
