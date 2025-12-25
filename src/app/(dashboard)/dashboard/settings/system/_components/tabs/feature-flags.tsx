"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function FeatureFlags({ config, onSave, saving }: any) {
    const [formData, setFormData] = useState(config || {})

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>Enable or disable specific features across the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Voice Recording</Label>
                            <p className="text-sm text-muted-foreground">Allow voice question responses</p>
                        </div>
                        <Switch checked={formData.enableVoiceRecording} onCheckedChange={(c) => setFormData({...formData, enableVoiceRecording: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>AI Evaluation</Label>
                            <p className="text-sm text-muted-foreground">Enable AI-powered candidate evaluation</p>
                        </div>
                        <Switch checked={formData.enableAIEvaluation} onCheckedChange={(c) => setFormData({...formData, enableAIEvaluation: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Interview Scheduling</Label>
                            <p className="text-sm text-muted-foreground">Enable calendar and interview booking</p>
                        </div>
                        <Switch checked={formData.enableInterviewScheduling} onCheckedChange={(c) => setFormData({...formData, enableInterviewScheduling: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Offer Management</Label>
                            <p className="text-sm text-muted-foreground">Enable offer creation and tracking</p>
                        </div>
                        <Switch checked={formData.enableOfferManagement} onCheckedChange={(c) => setFormData({...formData, enableOfferManagement: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Video Interviews</Label>
                            <p className="text-sm text-muted-foreground">Enable video interview functionality</p>
                        </div>
                        <Switch checked={formData.enableVideoInterviews} onCheckedChange={(c) => setFormData({...formData, enableVideoInterviews: c})} />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </form>
    )
}
