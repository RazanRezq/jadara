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

interface EmailSettingsProps {
    config: any
    onSave: (data: any) => Promise<void>
    saving: boolean
}

export function EmailSettings({ config, onSave, saving }: EmailSettingsProps) {
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
        const testEmail = prompt("Enter email address to send test email:")
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
                toast.success("Test email sent successfully")
            } else {
                toast.error(result.error || "Failed to send test email")
            }
        } catch (error) {
            toast.error("Error sending test email")
        } finally {
            setTesting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure email service for sending notifications and communications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Enable/Disable Email */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Email Service</Label>
                            <p className="text-sm text-muted-foreground">
                                Turn on email functionality for the system
                            </p>
                        </div>
                        <Switch
                            checked={formData.enabled}
                            onCheckedChange={(checked) => handleChange("enabled", checked)}
                        />
                    </div>

                    {/* Email Provider */}
                    <div className="space-y-2">
                        <Label htmlFor="provider">Email Provider</Label>
                        <Select
                            value={formData.provider}
                            onValueChange={(value) => handleChange("provider", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
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
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={formData.apiKey || ""}
                                onChange={(e) => handleChange("apiKey", e.target.value)}
                                placeholder="Enter API key"
                            />
                        </div>
                    )}

                    {/* SMTP Configuration */}
                    {formData.provider === "smtp" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpHost">SMTP Host</Label>
                                    <Input
                                        id="smtpHost"
                                        value={formData.smtpHost || ""}
                                        onChange={(e) => handleChange("smtpHost", e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPort">SMTP Port</Label>
                                    <Input
                                        id="smtpPort"
                                        type="number"
                                        value={formData.smtpPort || 587}
                                        onChange={(e) => handleChange("smtpPort", parseInt(e.target.value))}
                                        placeholder="587"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpUser">SMTP Username</Label>
                                    <Input
                                        id="smtpUser"
                                        value={formData.smtpUser || ""}
                                        onChange={(e) => handleChange("smtpUser", e.target.value)}
                                        placeholder="username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                                    <Input
                                        id="smtpPassword"
                                        type="password"
                                        value={formData.smtpPassword || ""}
                                        onChange={(e) => handleChange("smtpPassword", e.target.value)}
                                        placeholder="password"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* From Email */}
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email Address</Label>
                        <Input
                            id="fromEmail"
                            type="email"
                            value={formData.fromEmail || ""}
                            onChange={(e) => handleChange("fromEmail", e.target.value)}
                            placeholder="noreply@example.com"
                            required
                        />
                    </div>

                    {/* From Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                            id="fromName"
                            value={formData.fromName || ""}
                            onChange={(e) => handleChange("fromName", e.target.value)}
                            placeholder="GoIELTS Recruitment"
                            required
                        />
                    </div>

                    {/* Reply To */}
                    <div className="space-y-2">
                        <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
                        <Input
                            id="replyTo"
                            type="email"
                            value={formData.replyTo || ""}
                            onChange={(e) => handleChange("replyTo", e.target.value)}
                            placeholder="support@example.com"
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
                    {testing ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Test Email
                        </>
                    )}
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
