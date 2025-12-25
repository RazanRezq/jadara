"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function NotificationSettings({ config, onSave, saving }: any) {
    const [formData, setFormData] = useState(config || {})

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable Notifications</Label>
                        <Switch checked={formData.enabled} onCheckedChange={(c) => setFormData({...formData, enabled: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Email Notifications</Label>
                        <Switch checked={formData.emailNotifications} onCheckedChange={(c) => setFormData({...formData, emailNotifications: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>In-App Notifications</Label>
                        <Switch checked={formData.inAppNotifications} onCheckedChange={(c) => setFormData({...formData, inAppNotifications: c})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Slack Webhook (Optional)</Label>
                        <Input value={formData.slackWebhook || ""} onChange={(e) => setFormData({...formData, slackWebhook: e.target.value})} placeholder="https://hooks.slack.com/..." />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </form>
    )
}
