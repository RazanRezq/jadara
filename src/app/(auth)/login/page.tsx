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
        <div className="min-h-screen relative overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center">
            {/* Decorative circles in background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[400px] h-[400px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] rounded-full border border-gray-200 dark:border-white/5 -top-[100px] -left-[100px] md:-top-[180px] md:-left-[180px] lg:-top-[250px] lg:-left-[250px] animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] lg:w-[700px] lg:h-[700px] rounded-full border border-gray-200 dark:border-white/5 -bottom-[80px] -right-[80px] md:-bottom-[120px] md:-right-[120px] lg:-bottom-[180px] lg:-right-[180px] animate-[spin_45s_linear_infinite_reverse]" />
                <div className="absolute w-[500px] h-[500px] md:w-[800px] md:h-[800px] lg:w-[1100px] lg:h-[1100px] rounded-full border border-gray-200 dark:border-white/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_75s_linear_infinite]" />
            </div>

            {/* White/light panel on the right - hidden on mobile */}
            <div className="hidden md:block absolute right-0 top-0 w-[40%] lg:w-[45%] h-full bg-white dark:bg-slate-900/50 backdrop-blur-xl" />

            {/* Theme & Language Switcher */}
            <div className={cn(
                "absolute top-4 md:top-6 z-50 flex items-center gap-2",
                isRTL ? "left-4 md:left-6" : "right-4 md:right-6"
            )}>
                <ThemeToggle />
            </div>

            {/* Login card */}
            <div className="relative z-10 bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 sm:p-8 md:p-10 lg:p-12 w-[95%] sm:w-[90%] max-w-[480px] transition-all duration-300">
                {/* Header section */}
                <div className="relative flex items-center justify-between mb-6 md:mb-10">
                    {/* Logo */}
                    <div className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
                        GoIELTS
                    </div>

                    {/* Language selector */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 md:px-4 py-1.5 md:py-2 rounded-full cursor-pointer border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Title */}
                <h1 className="relative text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900 dark:text-white">
                    {t("auth.login")}
                </h1>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm text-center">
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
                            className="h-12 md:h-14 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-left placeholder:text-left placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all duration-300 font-medium text-gray-900 dark:text-white"
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
                                    "h-12 md:h-14 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all duration-300 font-medium text-gray-900 dark:text-white",
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
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
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
                            className="data-[state=checked]:bg-gray-900 dark:data-[state=checked]:bg-white data-[state=checked]:border-transparent transition-all duration-300"
                        />
                    </div>

                    {/* Login button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 md:h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold rounded-lg transition-all duration-300 hover:shadow-lg"
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
