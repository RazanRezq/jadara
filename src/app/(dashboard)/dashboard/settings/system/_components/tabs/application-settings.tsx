"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ApplicationSettings({ config, onSave, saving }: any) {
    const [formData, setFormData] = useState(config || {})

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Application Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input value={formData.siteName || ""} onChange={(e) => setFormData({...formData, siteName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Site URL</Label>
                        <Input value={formData.siteUrl || ""} onChange={(e) => setFormData({...formData, siteUrl: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Maintenance Mode</Label>
                        <Switch checked={formData.maintenanceMode} onCheckedChange={(c) => setFormData({...formData, maintenanceMode: c})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Default Language</Label>
                        <Select value={formData.defaultLanguage} onValueChange={(v) => setFormData({...formData, defaultLanguage: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">Arabic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </form>
    )
}
