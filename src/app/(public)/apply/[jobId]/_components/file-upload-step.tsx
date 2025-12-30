"use client"

import { useRef, useState } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    ArrowLeft,
    ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { uploadFile } from "./actions"
import { useApplicationStore } from "./store"

interface FileUploadStepProps {
    requireCV: boolean
    requirePortfolio: boolean
    onSubmit: (cvUrl?: string, portfolioUrl?: string) => Promise<void>
    isSubmitting: boolean
    onBack?: () => void
}

export function FileUploadStep({
    requireCV,
    requirePortfolio,
    onSubmit,
    isSubmitting,
    onBack,
}: FileUploadStepProps) {
    const { t, locale } = useTranslate()
    const cvInputRef = useRef<HTMLInputElement>(null)
    
    const isRTL = locale === "ar"
    const ArrowPrev = isRTL ? ArrowRight : ArrowLeft

    // Zustand store for notes
    const { notes, setNotes } = useApplicationStore()

    // Local state for files and URLs
    const [cvFile, setCvFile] = useState<File | null>(null)
    const [cvUrl, setCvUrl] = useState<string | null>(null)
    const [cvDragActive, setCvDragActive] = useState(false)
    const [isUploadingCv, setIsUploadingCv] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleCvDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setCvDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file && isValidFile(file)) {
            await handleCvUpload(file)
        }
    }

    const isValidFile = (file: File): boolean => {
        const maxSize = 10 * 1024 * 1024 // 10MB for CV
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]

        if (file.size > maxSize) {
            toast.error(t("apply.fileTooLarge") || "File is too large")
            return false
        }
        if (!validTypes.includes(file.type)) {
            toast.error(t("apply.invalidFileType") || "Invalid file type")
            return false
        }
        return true
    }

    /**
     * Upload CV to cloud storage and store URL locally
     * This uploads immediately but does NOT save to database
     */
    const handleCvUpload = async (file: File) => {
        if (!isValidFile(file)) return

        setIsUploadingCv(true)
        setCvFile(file)
        setUploadProgress(0)

        // Simulate progress while uploading (actual upload doesn't provide progress)
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval)
                    return 90
                }
                return prev + 10
            })
        }, 200)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("fileType", "cv")

            const result = await uploadFile(formData)

            if (!result.success || !result.url) {
                throw new Error(result.error || "Upload failed")
            }

            // Complete progress
            setUploadProgress(100)

            // Store URL locally (NOT in database)
            setCvUrl(result.url)
            toast.success(t("apply.cvUploaded") || "CV uploaded successfully")
        } catch (error) {
            toast.error(t("apply.uploadError") || "Failed to upload file")
            setCvFile(null)
            setUploadProgress(0)
        } finally {
            clearInterval(progressInterval)
            setIsUploadingCv(false)
        }
    }

    const handleRemoveCv = () => {
        setCvFile(null)
        setCvUrl(null)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    const canSubmit = (!requireCV || cvUrl) && !isUploadingCv

    /**
     * Handle final submission - passes URLs to parent for atomic DB save
     */
    const handleSubmit = async () => {
        await onSubmit(cvUrl || undefined, undefined)
    }

    return (
        <Card className="border-2 border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="size-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                    {t("apply.uploadDocuments")}
                </CardTitle>
                <p className="text-muted-foreground">
                    {t("apply.uploadDescription")}
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* CV Upload */}
                {requireCV && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="size-4" />
                                {t("apply.resume")}
                                {requireCV && (
                                    <Badge variant="secondary" className="text-xs">
                                        {t("jobs.required")}
                                    </Badge>
                                )}
                            </label>
                            {cvFile && !isUploadingCv && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveCv}
                                    className="h-auto p-1 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>

                        <input
                            ref={cvInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    await handleCvUpload(file)
                                }
                            }}
                        />

                        {isUploadingCv ? (
                            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Spinner className="size-5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-sm">{cvFile?.name}</p>
                                        <span className="text-xs text-muted-foreground">
                                            {t("apply.uploading") || "Uploading..."} {uploadProgress}%
                                        </span>
                                    </div>
                                </div>
                                <Progress value={uploadProgress} className="h-1.5" />
                            </div>
                        ) : cvUrl && cvFile ? (
                            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="size-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{cvFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(cvFile.size)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center",
                                    cvDragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                )}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setCvDragActive(true)
                                }}
                                onDragLeave={() => setCvDragActive(false)}
                                onDrop={handleCvDrop}
                                onClick={() => cvInputRef.current?.click()}
                            >
                                <Upload className="size-8 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-medium mb-1">
                                    {t("apply.dropOrClick")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    PDF, DOC, DOCX (max 10MB)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Additional Notes */}
                <div className="space-y-2">
                    <Label
                        htmlFor="notes"
                        className="text-sm font-medium flex items-center gap-2"
                    >
                        <MessageSquare className="size-4" />
                        {t("apply.additionalNotes")}
                    </Label>
                    <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => {
                            const text = e.target.value
                            if (text.length <= 500) {
                                setNotes(text)
                            }
                        }}
                        placeholder={t("apply.notesPlaceholder")}
                        className="min-h-[120px] resize-none"
                        dir={locale === "ar" ? "rtl" : "ltr"}
                        maxLength={500}
                    />
                    <p className={cn(
                        "text-xs",
                        notes.length > 450 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                        {notes.length} / 500
                    </p>
                </div>

                {/* Warning if required files missing */}
                {!canSubmit && !isUploadingCv && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            {t("apply.requiredFilesWarning")}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    {onBack && (
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 text-base gap-2"
                            onClick={onBack}
                            disabled={isSubmitting}
                        >
                            {isRTL && t("common.back")}
                            <ArrowPrev className="size-4" />
                            {!isRTL && t("common.back")}
                        </Button>
                    )}
                    <Button
                        size="lg"
                        className="flex-1 h-12 text-base gap-2"
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="size-4" />
                                {t("apply.submitting")}
                            </>
                        ) : (
                            <>
                                {t("apply.submitApplication")}
                                <CheckCircle2 className="size-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
