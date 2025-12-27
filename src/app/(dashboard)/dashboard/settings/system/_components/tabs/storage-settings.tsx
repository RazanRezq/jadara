"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"

interface StorageSettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function StorageSettings({ config, onSave, saving }: StorageSettingsProps) {
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
                        <Database className="h-5 w-5" />
                        {t("settings.system.storage.title")}
                    </CardTitle>
                    <CardDescription className="text-start">
                        {t("settings.system.storage.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Storage Provider */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.storage.provider")}</Label>
                        <Select
                            value={formData.provider}
                            onValueChange={(v) => setFormData({ ...formData, provider: v })}
                            dir={dir}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
                                <SelectItem value="aws-s3">AWS S3</SelectItem>
                                <SelectItem value="local">Local Storage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Max File Size */}
                    <div className="space-y-2 text-start">
                        <Label>{t("settings.system.storage.maxFileSize")}</Label>
                        <Input
                            type="number"
                            value={formData.maxFileSize || 10}
                            onChange={(e) => setFormData({ ...formData, maxFileSize: parseInt(e.target.value) })}
                            dir="ltr"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? t("settings.system.storage.saving") : t("settings.system.storage.saveChanges")}
                </Button>
            </div>
        </form>
    )
}
