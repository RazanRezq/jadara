"use client"

import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Clock,
    Mail,
    Sparkles,
    ExternalLink,
} from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import Lottie from "lottie-react"
import successAnimation from "@/../public/lottie/Success.json"

interface ThankYouPageProps {
    jobTitle: string
}

export function ThankYouPage({ jobTitle }: ThankYouPageProps) {
    const { t } = useTranslate()

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3000
        const end = Date.now() + duration

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ["#6366f1", "#8b5cf6", "#a855f7"],
            })
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ["#6366f1", "#8b5cf6", "#a855f7"],
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }

        frame()
    }, [])

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Sparkles className="size-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">SmartRecruit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-2xl">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                        <CardContent className="pt-12 pb-8 text-center">
                            {/* Success Animation */}
                            <div className="relative mb-4">
                                <div className="w-48 h-48 mx-auto">
                                    <Lottie
                                        animationData={successAnimation}
                                        loop={false}
                                        autoplay={true}
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {t("apply.thankYou")}
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                                {t("apply.applicationReceived")}
                            </p>

                            {/* Job Info */}
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 mb-8">
                                <p className="text-sm text-muted-foreground mb-1">
                                    {t("apply.appliedFor")}
                                </p>
                                <p className="font-semibold text-lg">{jobTitle}</p>
                            </div>

                            {/* Next Steps */}
                            <div className="space-y-4 text-start max-w-md mx-auto mb-8">
                                <h3 className="font-semibold text-center mb-4">
                                    {t("apply.whatHappensNext")}
                                </h3>
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {t("apply.step1Title")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("apply.step1Description")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Clock className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {t("apply.step2Title")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("apply.step2Description")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <Button
                                variant="outline"
                                size="lg"
                                className="gap-2"
                                onClick={() => (window.location.href = "/")}
                            >
                                {t("apply.backToHome")}
                                <ExternalLink className="size-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}


