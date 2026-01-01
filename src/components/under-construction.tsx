"use client"

import { Construction, Wrench, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/useTranslate"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UnderConstructionProps {
    title?: string
    description?: string
    showBackButton?: boolean
    className?: string
}

export function UnderConstruction({
    title,
    description,
    showBackButton = true,
    className,
}: UnderConstructionProps) {
    const { t, isRTL } = useTranslate()

    const defaultTitle = t("underConstruction.title")
    const defaultDescription = t("underConstruction.description")

    return (
        <div className={cn("flex items-center justify-center min-h-[calc(100vh-var(--header-height)-4rem)] p-6", className)}>
            <Card className="w-full max-w-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-background via-muted/30 to-background">
                <CardContent className="p-8 sm:p-12">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Animated Icon Group */}
                        <div className="relative">
                            {/* Background Circle */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl animate-pulse" />
                            
                            {/* Main Icon */}
                            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-full border-2 border-primary/20">
                                <Construction className="h-16 w-16 text-primary animate-bounce" />
                                
                                {/* Floating Tools */}
                                <div className="absolute -top-2 -right-2 bg-background rounded-full p-2 border-2 border-primary/30 shadow-lg animate-pulse">
                                    <Wrench className="h-6 w-6 text-primary" />
                                </div>
                                <div className="absolute -bottom-2 -left-2 bg-background rounded-full p-2 border-2 border-white/30 shadow-lg animate-pulse delay-75">
                                    <AlertCircle className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                                {title || defaultTitle}
                            </h2>
                            
                            {/* Construction Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                <span className="text-sm font-medium text-primary">
                                    {t("underConstruction.status")}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed">
                            {description || defaultDescription}
                        </p>

                        {/* Features Coming Soon */}
                        <div className="w-full max-w-md pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: "🎨", label: t("underConstruction.feature1") },
                                    { icon: "⚡", label: t("underConstruction.feature2") },
                                    { icon: "🔒", label: t("underConstruction.feature3") },
                                    { icon: "🚀", label: t("underConstruction.feature4") },
                                ].map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted-foreground/10 hover:border-primary/30 transition-all hover:scale-105"
                                    >
                                        <span className="text-2xl">{feature.icon}</span>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {feature.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="w-full max-w-md pt-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {t("underConstruction.progress")}
                                    </span>
                                    <span className="font-semibold text-primary">45%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"
                                        style={{ width: '45%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {showBackButton && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button asChild variant="default" size="lg" className="gap-2">
                                    <Link href="/dashboard">
                                        {isRTL ? (
                                            <>
                                                {t("underConstruction.backToDashboard")}
                                                <ArrowLeft className="h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                <ArrowLeft className="h-4 w-4" />
                                                {t("underConstruction.backToDashboard")}
                                            </>
                                        )}
                                    </Link>
                                </Button>
                                
                                <Button asChild variant="outline" size="lg">
                                    <Link href="/dashboard/jobs">
                                        {t("underConstruction.viewJobs")}
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Estimated Time */}
                        <p className="text-xs text-muted-foreground pt-4 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            {t("underConstruction.estimate")}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}







