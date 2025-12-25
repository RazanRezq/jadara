"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function SecuritySettings({ config, onSave, saving }: any) {
    const [formData, setFormData] = useState(config || {})

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" value={formData.sessionTimeout || 10080} onChange={(e) => setFormData({...formData, sessionTimeout: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Login Attempts</Label>
                        <Input type="number" value={formData.maxLoginAttempts || 5} onChange={(e) => setFormData({...formData, maxLoginAttempts: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Password Min Length</Label>
                        <Input type="number" value={formData.passwordMinLength || 8} onChange={(e) => setFormData({...formData, passwordMinLength: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Require Uppercase Letters</Label>
                        <Switch checked={formData.passwordRequireUppercase} onCheckedChange={(c) => setFormData({...formData, passwordRequireUppercase: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Require Numbers</Label>
                        <Switch checked={formData.passwordRequireNumbers} onCheckedChange={(c) => setFormData({...formData, passwordRequireNumbers: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Require 2FA</Label>
                        <Switch checked={formData.require2FA} onCheckedChange={(c) => setFormData({...formData, require2FA: c})} />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </form>
    )
}
