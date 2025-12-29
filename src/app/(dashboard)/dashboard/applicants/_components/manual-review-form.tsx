"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import {
    Star,
    Plus,
    X,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    CheckCircle,
    Edit,
    ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ManualReviewFormProps {
    applicantId: string
    jobId: string
    onReviewSubmitted?: () => void
    nextApplicantId?: string | null
}

type ReviewDecision = "strong_hire" | "recommended" | "neutral" | "not_recommended" | "strong_no"

interface ExistingReview {
    id: string
    rating: number
    decision: ReviewDecision
    pros: string[]
    cons: string[]
    privateNotes?: string
    summary?: string
    createdAt: string
    updatedAt: string
}

export function ManualReviewForm({
    applicantId,
    jobId,
    onReviewSubmitted,
    nextApplicantId,
}: ManualReviewFormProps) {
    const { t, dir, locale } = useTranslate()
    const router = useRouter()

    // Decision options with translations
    const decisionOptions: { value: ReviewDecision; label: string; color: string; icon: React.ReactNode }[] = [
        {
            value: "strong_hire",
            label: t("applicants.review.strongHire"),
            color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
            icon: <ThumbsUp className="h-4 w-4" />,
        },
        {
            value: "recommended",
            label: t("applicants.review.recommended"),
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            icon: <ThumbsUp className="h-4 w-4" />,
        },
        {
            value: "neutral",
            label: t("applicants.review.neutral"),
            color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            icon: null,
        },
        {
            value: "not_recommended",
            label: t("applicants.review.notRecommended"),
            color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            icon: <ThumbsDown className="h-4 w-4" />,
        },
        {
            value: "strong_no",
            label: t("applicants.review.strongNo"),
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            icon: <ThumbsDown className="h-4 w-4" />,
        },
    ]
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [existingReview, setExistingReview] = useState<ExistingReview | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Form state
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [decision, setDecision] = useState<ReviewDecision | "">("")
    const [pros, setPros] = useState<string[]>([])
    const [newPro, setNewPro] = useState("")
    const [cons, setCons] = useState<string[]>([])
    const [newCon, setNewCon] = useState("")
    const [privateNotes, setPrivateNotes] = useState("")
    const [summary, setSummary] = useState("")

    // Fetch existing review
    useEffect(() => {
        fetchMyReview()
    }, [applicantId])

    const fetchMyReview = async () => {
        try {
            const response = await fetch(`/api/reviews/my-review/${applicantId}`)
            const data = await response.json()
            if (data.success && data.review) {
                setExistingReview(data.review)
                // Pre-fill form
                setRating(data.review.rating)
                setDecision(data.review.decision)
                setPros(data.review.pros || [])
                setCons(data.review.cons || [])
                setPrivateNotes(data.review.privateNotes || "")
                setSummary(data.review.summary || "")
            }
        } catch (error) {
            console.error("Failed to fetch review:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddPro = () => {
        if (newPro.trim()) {
            setPros([...pros, newPro.trim()])
            setNewPro("")
        }
    }

    const handleAddCon = () => {
        if (newCon.trim()) {
            setCons([...cons, newCon.trim()])
            setNewCon("")
        }
    }

    const handleRemovePro = (index: number) => {
        setPros(pros.filter((_, i) => i !== index))
    }

    const handleRemoveCon = (index: number) => {
        setCons(cons.filter((_, i) => i !== index))
    }

    const handleSubmit = async (saveAndNext: boolean = false) => {
        if (rating === 0) {
            toast.error(t("applicants.review.pleaseProvideRating"))
            return
        }
        if (!decision) {
            toast.error(t("applicants.review.pleaseSelectDecision"))
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch("/api/reviews/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId,
                    jobId,
                    rating,
                    decision,
                    pros,
                    cons,
                    privateNotes,
                    summary,
                }),
            })

            const data = await response.json()
            if (data.success) {
                toast.success(existingReview ? t("applicants.review.reviewUpdated") : t("applicants.review.reviewSubmittedSuccess"))
                setExistingReview({
                    id: data.review.id,
                    rating,
                    decision: decision as ReviewDecision,
                    pros,
                    cons,
                    privateNotes,
                    summary,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                setIsEditing(false)

                // Handle Save & Next workflow
                if (saveAndNext && nextApplicantId) {
                    // Navigate to next applicant without closing dialog
                    router.push(`/dashboard/applicants?open=${nextApplicantId}&tab=review`)
                } else {
                    // Standard flow: call callback (which typically closes dialog)
                    onReviewSubmitted?.()
                }
            } else {
                toast.error(data.error || t("applicants.review.failedToSubmitReview"))
            }
        } catch (error) {
            toast.error(t("applicants.review.errorOccurred"))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Show existing review if not editing
    if (existingReview && !isEditing) {
        const decisionInfo = decisionOptions.find((d) => d.value === existingReview.decision)
        return (
            <Card dir={dir}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="text-start">
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                {t("applicants.review.yourReview") || "Your Review"}
                            </CardTitle>
                            <CardDescription className="text-start">
                                {t("applicants.review.submitted") || "Submitted"} {new Date(existingReview.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 me-2" />
                            {t("applicants.review.editReview") || "Edit"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Rating Display */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t("applicants.review.rating")}:</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "h-5 w-5",
                                        star <= existingReview.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-300"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            ({existingReview.rating}/5)
                        </span>
                    </div>

                    {/* Decision Display */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t("applicants.review.decision")}:</span>
                        <Badge className={cn(decisionInfo?.color, "flex items-center gap-1")}>
                            {decisionInfo?.icon}
                            {decisionInfo?.label}
                        </Badge>
                    </div>

                    {/* Pros */}
                    {existingReview.pros.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-green-600">{t("applicants.review.pros")}:</span>
                            <ul className="mt-1 space-y-1">
                                {existingReview.pros.map((pro, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                        <span className="text-green-500">+</span> {pro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cons */}
                    {existingReview.cons.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-red-600">{t("applicants.review.cons")}:</span>
                            <ul className="mt-1 space-y-1">
                                {existingReview.cons.map((con, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                        <span className="text-red-500">-</span> {con}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Summary */}
                    {existingReview.summary && (
                        <div>
                            <span className="text-sm font-medium">{t("applicants.review.summary")}:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                                {existingReview.summary}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card dir={dir}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    {existingReview ? t("applicants.review.editYourReview") : t("applicants.review.submitYourReview")}
                </CardTitle>
                <CardDescription>
                    {existingReview
                        ? t("applicants.review.updateEvaluation")
                        : t("applicants.review.provideEvaluation")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Rating */}
                <div className="space-y-2">
                    <Label>{t("applicants.review.ratingRequired")}</Label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        star <= (hoverRating || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-300 hover:text-amber-200"
                                    )}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="text-sm text-muted-foreground ms-2">
                                ({rating}/5)
                            </span>
                        )}
                    </div>
                </div>

                {/* Decision */}
                <div className="space-y-2">
                    <Label>{t("applicants.review.decisionRequired")}</Label>
                    <Select value={decision} onValueChange={(v) => setDecision(v as ReviewDecision)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("applicants.review.selectRecommendation")} />
                        </SelectTrigger>
                        <SelectContent>
                            {decisionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pros */}
                <div className="space-y-2">
                    <Label className="text-green-600">{t("applicants.review.prosStrengths")}</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder={t("applicants.review.addStrength")}
                            value={newPro}
                            onChange={(e) => setNewPro(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPro())}
                        />
                        <Button type="button" variant="outline" onClick={handleAddPro}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {pros.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {pros.map((pro, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                >
                                    + {pro}
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePro(i)}
                                        className="ms-1 hover:text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cons */}
                <div className="space-y-2">
                    <Label className="text-red-600">{t("applicants.review.consWeaknesses")}</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder={t("applicants.review.addWeakness")}
                            value={newCon}
                            onChange={(e) => setNewCon(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCon())}
                        />
                        <Button type="button" variant="outline" onClick={handleAddCon}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {cons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {cons.map((con, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                >
                                    - {con}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCon(i)}
                                        className="ms-1 hover:text-red-700"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="space-y-2">
                    <Label>{t("applicants.review.summaryOptional")}</Label>
                    <Textarea
                        placeholder={t("applicants.review.summaryPlaceholder")}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={2}
                    />
                </div>

                {/* Private Notes */}
                <div className="space-y-2">
                    <Label>{t("applicants.review.privateNotesLabel")}</Label>
                    <Textarea
                        placeholder={t("applicants.review.privateNotesPlaceholder")}
                        value={privateNotes}
                        onChange={(e) => setPrivateNotes(e.target.value)}
                        rows={2}
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-2 justify-end">
                    {isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            {t("applicants.review.cancel")}
                        </Button>
                    )}

                    {/* Save & Next Button - Only show if there's a next applicant */}
                    {nextApplicantId && (
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("applicants.review.submitting")}
                                </>
                            ) : (
                                <>
                                    {t("applicants.review.saveAndNext")}
                                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                </>
                            )}
                        </Button>
                    )}

                    {/* Standard Submit Button */}
                    <Button onClick={() => handleSubmit(false)} disabled={submitting}>
                        {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        {submitting
                            ? t("applicants.review.submitting")
                            : existingReview
                                ? t("applicants.review.updateReview")
                                : t("applicants.review.submitReview")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
