"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import { loginAction } from "./actions"
import { useTranslate } from "@/hooks/useTranslate"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const { t, isRTL, locale } = useTranslate()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
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

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || t("auth.loginFailed"))
                return
            }

            const data = await response.json()

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

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a] flex items-center justify-center">
            {/* Animated gradient blur orbs */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Top left gradient orb */}
                <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 dark:from-blue-600/20 dark:via-purple-600/15 dark:to-pink-600/20 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

                {/* Bottom right gradient orb */}
                <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-gradient-to-tl from-cyan-400/30 via-teal-400/20 to-emerald-400/30 dark:from-cyan-600/20 dark:via-teal-600/15 dark:to-emerald-600/20 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />

                {/* Center gradient orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-br from-violet-400/20 via-fuchsia-400/15 to-rose-400/20 dark:from-violet-600/15 dark:via-fuchsia-600/10 dark:to-rose-600/15 blur-3xl animate-[spin_20s_linear_infinite]" />

                {/* Additional accent orbs */}
                <div className="absolute top-[15%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-400/25 to-orange-400/25 dark:from-amber-600/15 dark:to-orange-600/15 blur-2xl animate-[pulse_6s_ease-in-out_infinite_2s]" />

                <div className="absolute bottom-[25%] left-[15%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-indigo-400/25 to-blue-400/25 dark:from-indigo-600/15 dark:to-blue-600/15 blur-2xl animate-[pulse_7s_ease-in-out_infinite_3s]" />
            </div>

            {/* Glassmorphism overlay */}
            <div className="hidden md:block absolute right-0 top-0 w-[40%] lg:w-[45%] h-full bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border-l border-white/20 dark:border-white/5" />

            {/* Theme & Language Switcher */}
            <div className={cn(
                "absolute top-4 md:top-6 z-50 flex items-center gap-2",
                isRTL ? "left-4 md:left-6" : "right-4 md:right-6"
            )}>
                <ThemeToggle />
            </div>

            {/* Login card */}
            <div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 p-6 sm:p-8 md:p-10 lg:p-12 w-[95%] sm:w-[90%] max-w-[480px] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
                {/* Header section */}
                <div className="relative flex items-center justify-between mb-6 md:mb-10">
                    {/* Logo */}
                    <div className="text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                        Jadara
                    </div>

                    {/* Language selector */}
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full cursor-pointer border border-gray-300/50 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all duration-300">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Title */}
                <h1 className="relative text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                    {t("auth.login")}
                </h1>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50/80 dark:bg-red-950/50 backdrop-blur-xl border border-red-300/50 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm text-center animate-[pulse_0.5s_ease-in-out]">
                        {error}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="relative space-y-4 md:space-y-6">
                    {/* Email field */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className={cn("text-sm font-medium block text-gray-700 dark:text-slate-200", isRTL ? "text-right" : "text-left")}>
                            <span className="text-red-500">*</span> {t("auth.emailRequired")}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@academy.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="h-12 md:h-14 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-300/50 dark:border-slate-700/50 text-left placeholder:text-left placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20 transition-all duration-300 font-medium text-gray-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-800/70"
                            dir="ltr"
                        />
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className={cn("text-sm font-medium block text-gray-700 dark:text-slate-200", isRTL ? "text-right" : "text-left")}>
                            <span className="text-red-500">*</span> {t("auth.passwordRequired")}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t("auth.enterPassword")}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className={cn(
                                    "h-12 md:h-14 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-300/50 dark:border-slate-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20 transition-all duration-300 font-medium text-gray-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-800/70",
                                    isRTL ? "ps-12 text-right" : "pe-12 text-left"
                                )}
                                dir={isRTL ? "rtl" : "ltr"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300",
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
                        <div className="text-center pt-1">
                            <a
                                href="#"
                                className="text-sm text-violet-600 dark:text-violet-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium hover:underline decoration-2 underline-offset-2"
                                onClick={(e) => e.preventDefault()}
                            >
                                {t("auth.forgotPassword")}
                            </a>
                        </div>
                    </div>

                    {/* Remember me checkbox */}
                    <div className="flex items-center justify-center gap-3 py-2">
                        <Label
                            htmlFor="remember"
                            className="text-sm font-medium cursor-pointer select-none text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {t("auth.rememberMe")}
                        </Label>
                        <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            className="data-[state=checked]:bg-violet-600 dark:data-[state=checked]:bg-violet-500 data-[state=checked]:border-transparent transition-all duration-300 border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    {/* Login button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 md:h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Spinner className="w-5 h-5" />
                                {t("auth.signingIn")}
                            </span>
                        ) : (
                            t("auth.login")
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
