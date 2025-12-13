"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff, BookOpen, Shield, Users, CheckCircle2 } from "lucide-react"
import { loginAction } from "./actions"
import { useTranslate } from "@/hooks/useTranslate"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const { t, isRTL } = useTranslate()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || t("auth.loginFailed"))
                return
            }

            // Create session cookie via server action
            await loginAction({
                userId: data.user.userId,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role,
            })

            router.push("/dashboard")
            router.refresh()
        } catch {
            setError(t("auth.loginFailed"))
        } finally {
            setIsLoading(false)
        }
    }

    const features = [
        { icon: BookOpen, textKey: "features.comprehensiveMaterials" },
        { icon: Shield, textKey: "features.roleBasedAccess" },
        { icon: Users, textKey: "features.multiUserManagement" },
        { icon: CheckCircle2, textKey: "features.progressTracking" },
    ]

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Panel - Branding */}
            <div className={cn(
                "hidden lg:flex lg:w-1/2 relative overflow-hidden",
                isRTL && "order-2"
            )}>
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar/80 to-sidebar/60 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]" />
                
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-40 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-500" />
                </div>

                {/* Grid pattern overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Content */}
                <div className={cn(
                    "relative z-10 flex flex-col justify-center px-16 xl:px-24",
                    isRTL && "text-right"
                )}>
                    {/* Logo */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                                {t("branding.goielts")}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-lg">{t("branding.adminPortal")}</p>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
                        {t("branding.tagline").split(" ").slice(0, -2).join(" ")}{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            {t("branding.tagline").split(" ").slice(-2).join(" ")}
                        </span>
                    </h1>

                    <p className="text-muted-foreground text-lg mb-12 max-w-md leading-relaxed">
                        {t("branding.description")}
                    </p>

                    {/* Features list */}
                    <div className="space-y-5">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-4 text-muted-foreground"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                                    <feature.icon className="w-5 h-5 text-cyan-500" />
                                </div>
                                <span className="text-base">{t(feature.textKey)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className={cn(
                "w-full lg:w-1/2 flex items-center justify-center p-8 bg-background",
                isRTL && "order-1"
            )}>
                <div className="w-full max-w-md">
                    {/* Theme & Language Switcher */}
                    <div className={cn(
                        "absolute top-6 flex items-center gap-2",
                        isRTL ? "left-6" : "right-6"
                    )}>
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-12 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                {t("branding.goielts")}
                            </span>
                        </div>
                    </div>

                    {/* Form header */}
                    <div className={cn("mb-10", isRTL && "text-right")}>
                        <h2 className="text-3xl font-bold text-foreground mb-3">
                            {t("auth.welcomeBack")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("auth.signInToAccess")}
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                {t("auth.emailAddress")}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t("auth.emailPlaceholder")}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className={cn(
                                    "h-12 rounded-xl",
                                    isRTL && "text-right"
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                {t("common.password")}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("auth.passwordPlaceholder")}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className={cn(
                                        "h-12 rounded-xl",
                                        isRTL ? "pl-12 text-right" : "pr-12"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={cn(
                                        "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                                        isRTL ? "left-4" : "right-4"
                                    )}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/30 hover:scale-[1.02]"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="w-5 h-5" />
                                    {t("auth.signingIn")}
                                </span>
                            ) : (
                                t("auth.signIn")
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-muted-foreground text-sm">
                            {t("auth.protectedByRBAC")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
