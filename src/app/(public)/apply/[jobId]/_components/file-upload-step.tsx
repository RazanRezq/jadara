"use client"

import { useRef, useState } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadStepProps {
    requireCV: boolean
    requirePortfolio: boolean
    cvFile: File | null
    portfolioFile: File | null
    onCvChange: (file: File | null) => void
    onPortfolioChange: (file: File | null) => void
    onSubmit: () => void
    isSubmitting: boolean
}

export function FileUploadStep({
    requireCV,
    requirePortfolio,
    cvFile,
    portfolioFile,
    onCvChange,
    onPortfolioChange,
    onSubmit,
    isSubmitting,
}: FileUploadStepProps) {
    const { t } = useTranslate()
    const cvInputRef = useRef<HTMLInputElement>(null)
    const portfolioInputRef = useRef<HTMLInputElement>(null)
    const [cvDragActive, setCvDragActive] = useState(false)
    const [portfolioDragActive, setPortfolioDragActive] = useState(false)

    const handleCvDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setCvDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file && isValidFile(file, "cv")) {
            onCvChange(file)
        }
    }

    const handlePortfolioDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setPortfolioDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file && isValidFile(file, "portfolio")) {
            onPortfolioChange(file)
        }
    }

    const isValidFile = (file: File, type: "cv" | "portfolio"): boolean => {
        const maxSize = type === "cv" ? 10 * 1024 * 1024 : 25 * 1024 * 1024 // 10MB for CV, 25MB for portfolio
        const validTypes =
            type === "cv"
                ? ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
                : ["application/pdf", "image/jpeg", "image/png", "application/zip"]

        if (file.size > maxSize) {
            return false
        }
        if (!validTypes.includes(file.type)) {
            return false
        }
        return true
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    const canSubmit =
        (!requireCV || cvFile) && (!requirePortfolio || portfolioFile)

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                {(requireCV || !requirePortfolio) && (
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
                            {cvFile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCvChange(null)}
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
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && isValidFile(file, "cv")) {
                                    onCvChange(file)
                                }
                            }}
                        />

                        {cvFile ? (
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

                {/* Portfolio Upload */}
                {requirePortfolio && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Briefcase className="size-4" />
                                {t("apply.portfolio")}
                                <Badge variant="secondary" className="text-xs">
                                    {t("jobs.required")}
                                </Badge>
                            </label>
                            {portfolioFile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onPortfolioChange(null)}
                                    className="h-auto p-1 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>

                        <input
                            ref={portfolioInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.zip"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && isValidFile(file, "portfolio")) {
                                    onPortfolioChange(file)
                                }
                            }}
                        />

                        {portfolioFile ? (
                            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="size-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {portfolioFile.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(portfolioFile.size)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center",
                                    portfolioDragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                )}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setPortfolioDragActive(true)
                                }}
                                onDragLeave={() => setPortfolioDragActive(false)}
                                onDrop={handlePortfolioDrop}
                                onClick={() => portfolioInputRef.current?.click()}
                            >
                                <Upload className="size-8 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-medium mb-1">
                                    {t("apply.dropOrClick")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    PDF, JPG, PNG, ZIP (max 25MB)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Warning if required files missing */}
                {!canSubmit && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            {t("apply.requiredFilesWarning")}
                        </p>
                    </div>
                )}

                <Button
                    size="lg"
                    className="w-full h-12 text-base gap-2"
                    onClick={onSubmit}
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
            </CardContent>
        </Card>
    )
}

