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

interface AISettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function AISettings({ config, onSave, saving }: AISettingsProps) {
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
                toast.success(`AI configuration test successful (${result.provider}, ${result.model})`)
            } else {
                toast.error(result.error || "AI test failed")
            }
        } catch (error) {
            toast.error("Error testing AI configuration")
        } finally {
            setTesting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure AI service for candidate evaluation and analysis
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable AI Evaluation</Label>
                            <p className="text-sm text-muted-foreground">
                                Turn on AI-powered candidate evaluation
                            </p>
                        </div>
                        <Switch
                            checked={formData.enabled}
                            onCheckedChange={(checked) => handleChange("enabled", checked)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <Select value={formData.provider} onValueChange={(value) => handleChange("provider", value)}>
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

                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            value={formData.apiKey || ""}
                            onChange={(e) => handleChange("apiKey", e.target.value)}
                            placeholder="Enter API key"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                            value={formData.model || ""}
                            onChange={(e) => handleChange("model", e.target.value)}
                            placeholder="e.g., gemini-2.0-flash-exp"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Temperature: {formData.temperature?.toFixed(1) || 0.7}</Label>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[formData.temperature || 0.7]}
                            onValueChange={([value]) => handleChange("temperature", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lower = More consistent, Higher = More creative
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                            type="number"
                            value={formData.maxTokens || 8000}
                            onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fallback Model (Optional)</Label>
                        <Input
                            value={formData.fallbackModel || ""}
                            onChange={(e) => handleChange("fallbackModel", e.target.value)}
                            placeholder="Model to use if primary fails"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleTest} disabled={!formData.enabled || testing}>
                    {testing ? "Testing..." : <><Zap className="h-4 w-4 mr-2" />Test AI Configuration</>}
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
