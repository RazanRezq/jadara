"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import { Sparkles, CheckCircle2, AlertCircle, Zap, Heart, Scissors, FileText, SpellCheck, Smile } from "lucide-react"
import { generateJobDescription } from "./ai-actions"
import { toast } from "sonner"

interface ContextSelectorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    jobTitle: string
    employmentType: string
    workPlace: string
    onDescriptionGenerated: (description: string) => void
}

type Step = "select" | "generating" | "success"

// Predefined vibe chips
const VIBE_CHIPS = [
    { id: "startup", label: "Startup Vibe", labelAr: "أجواء الشركات الناشئة", icon: "🚀" },
    { id: "professional", label: "Professional", labelAr: "احترافي", icon: "💼" },
    { id: "creative", label: "Creative", labelAr: "إبداعي", icon: "🎨" },
    { id: "fast-paced", label: "Fast-Paced", labelAr: "سريع الوتيرة", icon: "⚡" },
    { id: "collaborative", label: "Collaborative", labelAr: "تعاوني", icon: "🤝" },
    { id: "innovative", label: "Innovative", labelAr: "مبتكر", icon: "💡" },
    { id: "flexible", label: "Flexible", labelAr: "مرن", icon: "🌈" },
    { id: "dynamic", label: "Dynamic", labelAr: "ديناميكي", icon: "⚙️" },
]

// Predefined benefit chips
const BENEFIT_CHIPS = [
    { id: "health", label: "Health Insurance", labelAr: "تأمين صحي", icon: "🏥" },
    { id: "remote", label: "Remote Work", labelAr: "عمل عن بُعد", icon: "🏠" },
    { id: "bonuses", label: "Performance Bonuses", labelAr: "مكافآت الأداء", icon: "💰" },
    { id: "training", label: "Training & Development", labelAr: "تدريب وتطوير", icon: "📚" },
    { id: "vacation", label: "Paid Vacation", labelAr: "إجازة مدفوعة", icon: "🏖️" },
    { id: "equipment", label: "Remote Setup", labelAr: "معدات العمل عن بُعد", icon: "💻" },
    { id: "growth", label: "Career Growth", labelAr: "نمو مهني", icon: "📈" },
    { id: "flexible-hours", label: "Flexible Hours", labelAr: "ساعات عمل مرنة", icon: "⏰" },
]

// Tone of voice options (updated - no emoji references)
const TONE_OPTIONS = [
    {
        value: "professional-formal",
        label: "Professional & Formal",
        labelAr: "احترافي ورسمي",
        description: "Best for Corporate/Senior roles",
        descriptionAr: "الأفضل للوظائف المؤسسية/الرئيسية"
    },
    {
        value: "friendly-smart",
        label: "Friendly & Smart",
        labelAr: "ودود وذكي",
        description: "Best for Tech/Startups",
        descriptionAr: "الأفضل للتقنية/الشركات الناشئة"
    },
    {
        value: "energetic-engaging",
        label: "Energetic & Engaging",
        labelAr: "نشط وجذاب",
        description: "Best for Marketing/Creative roles",
        descriptionAr: "الأفضل لوظائف التسويق/الإبداعية"
    },
]

// Emoji style options
const EMOJI_OPTIONS = [
    {
        value: "no-emojis",
        label: "No Emojis",
        labelAr: "بدون إيموجي",
        icon: "⛔",
        description: "Strictly professional, no emojis",
        descriptionAr: "احترافي تماماً، بدون إيموجي"
    },
    {
        value: "moderate",
        label: "Moderate",
        labelAr: "معتدل",
        icon: "✨",
        description: "Light emoji use (1 per section)",
        descriptionAr: "استخدام خفيف (1 لكل قسم)"
    },
]

export function ContextSelectorModal({
    open,
    onOpenChange,
    jobTitle,
    employmentType,
    workPlace,
    onDescriptionGenerated,
}: ContextSelectorModalProps) {
    const { t, isRTL, locale } = useTranslate()
    const [step, setStep] = useState<Step>("select")
    const [selectedVibes, setSelectedVibes] = useState<string[]>([])
    const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
    const [toneOfVoice, setToneOfVoice] = useState<string>("")
    const [emojiStyle, setEmojiStyle] = useState<string>("moderate")
    const [customDetails, setCustomDetails] = useState<string>("")
    const [generatedDescription, setGeneratedDescription] = useState("")
    const [error, setError] = useState("")

    // Reset state when modal opens
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setTimeout(() => {
                setStep("select")
                setSelectedVibes([])
                setSelectedBenefits([])
                setToneOfVoice("")
                setEmojiStyle("moderate")
                setCustomDetails("")
                setGeneratedDescription("")
                setError("")
            }, 300)
        }
        onOpenChange(newOpen)
    }

    // Toggle vibe selection
    const toggleVibe = (id: string) => {
        setSelectedVibes(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        )
    }

    // Toggle benefit selection
    const toggleBenefit = (id: string) => {
        setSelectedBenefits(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        )
    }

    // Generate description
    const handleGenerate = async (refinementInstruction?: string) => {
        setError("")
        setStep("generating")

        try {
            // Get full labels for selected items
            const vibeLabels = selectedVibes.map(id => {
                const chip = VIBE_CHIPS.find(v => v.id === id)
                return locale === 'ar' ? chip?.labelAr : chip?.label
            }).filter(Boolean) as string[]

            const benefitLabels = selectedBenefits.map(id => {
                const chip = BENEFIT_CHIPS.find(b => b.id === id)
                return locale === 'ar' ? chip?.labelAr : chip?.label
            }).filter(Boolean) as string[]

            // Get tone label
            const toneLabel = toneOfVoice
                ? TONE_OPTIONS.find(t => t.value === toneOfVoice)
                : null
            const toneLabelText = toneLabel
                ? (locale === 'ar' ? toneLabel.labelAr : toneLabel.label)
                : undefined

            const result = await generateJobDescription({
                jobTitle,
                employmentType,
                workPlace,
                vibeChips: vibeLabels,
                benefitChips: benefitLabels,
                toneOfVoice: toneLabelText,
                emojiStyle: emojiStyle || undefined,
                customDetails: customDetails.trim() || undefined,
                refinementInstruction,
                currentDescription: refinementInstruction ? generatedDescription : undefined,
            })

            if (result.success && result.description) {
                setGeneratedDescription(result.description)
                setStep("success")
            } else {
                setError(result.error || "Failed to generate description")
                toast.error(result.error || "Failed to generate description")
                setStep("select")
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error"
            setError(message)
            toast.error(message)
            setStep("select")
        }
    }

    // Handle refinement - map button actions to clear English instructions
    const handleRefinement = (action: 'shorten' | 'formal' | 'grammar') => {
        const instructions = {
            shorten: "Make the description more concise and shorter while keeping all essential information.",
            formal: "Make the tone more formal and professional, suitable for corporate environments.",
            grammar: "Fix any grammar, spelling, or language errors. Polish the text for clarity and professionalism."
        }
        handleGenerate(instructions[action])
    }

    // Use the generated description
    const handleUseDescription = () => {
        onDescriptionGenerated(generatedDescription)
        handleOpenChange(false)
        toast.success(t("jobWizard.aiGeneration.descriptionApplied"))
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto text-start">
                {/* Step 1: Context Selection */}
                {step === "select" && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">
                                        {t("jobWizard.contextSelector.title")}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t("jobWizard.contextSelector.subtitle")}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Job Details Summary */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    {t("jobWizard.contextSelector.jobDetails")}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">{t("jobWizard.step1.jobTitle")}:</span>
                                        <p className="font-medium">{jobTitle || "-"}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">{t("jobWizard.step1.workType")}:</span>
                                        <p className="font-medium">{employmentType || "-"}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">{t("jobWizard.step1.location")}:</span>
                                        <p className="font-medium">{workPlace || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Vibe Chips */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-pink-500" />
                                    {t("jobWizard.contextSelector.vibeTitle")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t("jobWizard.contextSelector.vibeDescription")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {VIBE_CHIPS.map((chip) => (
                                        <Badge
                                            key={chip.id}
                                            variant={selectedVibes.includes(chip.id) ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105",
                                                selectedVibes.includes(chip.id)
                                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white"
                                                    : "hover:border-purple-500"
                                            )}
                                            onClick={() => toggleVibe(chip.id)}
                                        >
                                            <span className="me-1">{chip.icon}</span>
                                            {locale === 'ar' ? chip.labelAr : chip.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Benefit Chips */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-slate-600" />
                                    {t("jobWizard.contextSelector.benefitsTitle")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t("jobWizard.contextSelector.benefitsDescription")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {BENEFIT_CHIPS.map((chip) => (
                                        <Badge
                                            key={chip.id}
                                            variant={selectedBenefits.includes(chip.id) ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105",
                                                selectedBenefits.includes(chip.id)
                                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white"
                                                    : "hover:border-slate-500"
                                            )}
                                            onClick={() => toggleBenefit(chip.id)}
                                        >
                                            <span className="me-1">{chip.icon}</span>
                                            {locale === 'ar' ? chip.labelAr : chip.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Tone of Voice Selector */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    {t("jobWizard.contextSelector.toneTitle")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t("jobWizard.contextSelector.toneDescription")}
                                </p>
                                <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t("jobWizard.contextSelector.tonePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TONE_OPTIONS.map((tone) => (
                                            <SelectItem key={tone.value} value={tone.value}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {locale === 'ar' ? tone.labelAr : tone.label}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {locale === 'ar' ? tone.descriptionAr : tone.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Section 3.5: Emoji Style Selector */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Smile className="h-5 w-5 text-yellow-500" />
                                    {t("jobWizard.contextSelector.emojiTitle")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t("jobWizard.contextSelector.emojiDescription")}
                                </p>
                                <RadioGroup value={emojiStyle} onValueChange={setEmojiStyle} className="space-y-3">
                                    {EMOJI_OPTIONS.map((option) => (
                                        <div key={option.value} className="flex items-start space-x-3 space-x-reverse">
                                            <RadioGroupItem value={option.value} id={option.value} />
                                            <Label
                                                htmlFor={option.value}
                                                className="flex flex-col cursor-pointer flex-1"
                                            >
                                                <span className="font-medium flex items-center gap-2">
                                                    <span>{option.icon}</span>
                                                    {locale === 'ar' ? option.labelAr : option.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    {locale === 'ar' ? option.descriptionAr : option.description}
                                                </span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Section 4: Custom Details */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                    {t("jobWizard.contextSelector.customDetailsTitle")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t("jobWizard.contextSelector.customDetailsDescription")}
                                </p>
                                <Textarea
                                    value={customDetails}
                                    onChange={(e) => setCustomDetails(e.target.value)}
                                    placeholder={t("jobWizard.contextSelector.customDetailsPlaceholder")}
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Selection Summary */}
                            {(selectedVibes.length > 0 || selectedBenefits.length > 0) && (
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                    <p className="text-sm text-primary font-medium">
                                        ✨ {t("jobWizard.contextSelector.selected")}: {selectedVibes.length + selectedBenefits.length} {t("jobWizard.contextSelector.items")}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                {t("common.cancel")}
                            </Button>
                            <Button
                                onClick={() => handleGenerate()}
                                disabled={!jobTitle}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                <Sparkles className="h-4 w-4 me-2" />
                                {t("jobWizard.contextSelector.generate")}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Step 2: Generating (Loading State) */}
                {step === "generating" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t("jobWizard.aiGeneration.generating")}</DialogTitle>
                            <DialogDescription>
                                {t("jobWizard.aiGeneration.generatingDesc")}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                                    <Sparkles className="h-10 w-10 text-white" />
                                </div>
                                <Spinner className="absolute -top-2 -right-2 h-24 w-24 text-primary" />
                            </div>
                            <p className="mt-6 text-lg font-medium">{t("jobWizard.aiGeneration.creatingDescription")}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {t("jobWizard.aiGeneration.thisWillTake")}
                            </p>
                        </div>
                    </>
                )}

                {/* Step 3: Success - Show Generated Description */}
                {step === "success" && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">
                                        {t("jobWizard.aiGeneration.success")}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t("jobWizard.aiGeneration.successDesc")}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {generatedDescription}
                                </div>
                            </div>

                            {/* Refinement Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefinement('shorten')}
                                    className="flex items-center gap-2"
                                >
                                    <Scissors className="h-4 w-4" />
                                    {t("jobWizard.contextSelector.refineShorten")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefinement('formal')}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {t("jobWizard.contextSelector.refineFormal")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefinement('grammar')}
                                    className="flex items-center gap-2"
                                >
                                    <SpellCheck className="h-4 w-4" />
                                    {t("jobWizard.contextSelector.refineGrammar")}
                                </Button>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    💡 {t("jobWizard.aiGeneration.editTip")}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setStep("select")}
                            >
                                {t("jobWizard.aiGeneration.regenerate")}
                            </Button>
                            <Button
                                onClick={handleUseDescription}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                                <CheckCircle2 className="h-4 w-4 me-2" />
                                {t("jobWizard.aiGeneration.useDescription")}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

