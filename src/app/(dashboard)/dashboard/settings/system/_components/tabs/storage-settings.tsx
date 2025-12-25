"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function StorageSettings({ config, onSave, saving }: any) {
    const [formData, setFormData] = useState(config || {})

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Storage Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Storage Provider</Label>
                        <Select value={formData.provider} onValueChange={(v) => setFormData({...formData, provider: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
                                <SelectItem value="aws-s3">AWS S3</SelectItem>
                                <SelectItem value="local">Local Storage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Max File Size (MB)</Label>
                        <Input type="number" value={formData.maxFileSize || 10} onChange={(e) => setFormData({...formData, maxFileSize: parseInt(e.target.value)})} />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </form>
    )
}
