"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, UserCheck } from "lucide-react";
import { loginAction } from "./actions";
import { useTranslate } from "@/hooks/useTranslate";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/demoMode";

export default function LoginPage() {
  const router = useRouter();
  const { t, isRTL } = useTranslate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t("auth.loginFailed"));
        return;
      }

      const data = await response.json();

      // Create session cookie via server action
      await loginAction({
        userId: data.user.userId,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuestLogin() {
    setIsGuestLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: DEMO_USER_EMAIL,
          password: DEMO_USER_PASSWORD,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t("auth.demoLoginFailed"));
        return;
      }

      const data = await response.json();

      // Create session cookie via server action
      await loginAction({
        userId: data.user.userId,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.demoLoginFailed"));
    } finally {
      setIsGuestLoading(false);
    }
  }

  return (
    <div className="min-h-dvh w-full relative overflow-hidden bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a] flex items-center justify-center py-8 md:py-12">
      {/* Animated gradient blur orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left gradient orb */}
        <div className="absolute -top-[20%] -left-[10%] w-125 h-125 md:w-175 md:h-175 rounded-full bg-linear-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 dark:from-blue-600/20 dark:via-purple-600/15 dark:to-pink-600/20 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

        {/* Bottom right gradient orb */}
        <div className="absolute -bottom-[20%] -right-[10%] w-150 h-150 md:w-200 md:h-200 rounded-full bg-linear-to-tl from-cyan-400/30 via-teal-400/20 to-emerald-400/30 dark:from-cyan-600/20 dark:via-teal-600/15 dark:to-emerald-600/20 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />

        {/* Center gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 md:w-150 md:h-150 rounded-full bg-linear-to-br from-violet-400/20 via-fuchsia-400/15 to-rose-400/20 dark:from-violet-600/15 dark:via-fuchsia-600/10 dark:to-rose-600/15 blur-3xl animate-[spin_20s_linear_infinite]" />

        {/* Additional accent orbs */}
        <div className="absolute top-[15%] right-[20%] w-75 h-75 rounded-full bg-linear-to-br from-amber-400/25 to-orange-400/25 dark:from-amber-600/15 dark:to-orange-600/15 blur-2xl animate-[pulse_6s_ease-in-out_infinite_2s]" />

        <div className="absolute bottom-[25%] left-[15%] w-87.5 h-87.5 rounded-full bg-linear-to-br from-indigo-400/25 to-blue-400/25 dark:from-indigo-600/15 dark:to-blue-600/15 blur-2xl animate-[pulse_7s_ease-in-out_infinite_3s]" />
      </div>

      {/* Theme & Language Switcher */}
      <div
        className={cn(
          "absolute top-3 md:top-4 z-50 flex items-center gap-2",
          isRTL ? "left-3 md:left-4" : "right-3 md:right-4"
        )}
      >
        <ThemeToggle />
      </div>

      {/* Login card */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 p-5 sm:p-6 md:p-6 w-[95%] sm:w-[90%] max-w-115 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
        {/* Header section */}
        <div className="relative flex items-center justify-between mb-2">
          {/* Logo */}
          <div className="text-xl md:text-2xl font-black tracking-tighter bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent font-sans">
            {t("branding.jadara")}
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl px-2.5 md:px-3 py-1 md:py-1.5 rounded-full cursor-pointer border border-gray-300/50 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all duration-300">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Title */}
        <h1 className="relative text-center text-xl md:text-2xl font-bold mb-4 bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
          {t("auth.login")}
        </h1>

        {/* Error message */}
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50/80 dark:bg-red-950/50 backdrop-blur-xl border border-red-300/50 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm text-center animate-[pulse_0.5s_ease-in-out]">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="relative space-y-3">
          {/* Email field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className={cn(
                "text-xs font-medium block text-gray-700 dark:text-slate-200",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <span className="text-red-500">*</span> {t("auth.emailRequired")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@academy.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-300/50 dark:border-slate-700/50 text-left placeholder:text-left placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20 transition-all duration-300 font-medium text-gray-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-800/70"
              dir="ltr"
            />
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className={cn(
                "text-xs font-medium block text-gray-700 dark:text-slate-200",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <span className="text-red-500">*</span>{" "}
              {t("auth.passwordRequired")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.enterPassword")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className={cn(
                  "h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-gray-300/50 dark:border-slate-700/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20 transition-all duration-300 font-medium text-gray-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-800/70",
                  isRTL ? "ps-10 text-right" : "pe-10 text-left"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300",
                  isRTL ? "left-3" : "right-3"
                )}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-center pt-0.5">
              <a
                href="#"
                className="text-xs text-violet-600 dark:text-violet-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium hover:underline decoration-2 underline-offset-2"
                onClick={(e) => e.preventDefault()}
              >
                {t("auth.forgotPassword")}
              </a>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-center gap-2 py-1">
            <Label
              htmlFor="remember"
              className="text-xs font-medium cursor-pointer select-none text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            disabled={isLoading || isGuestLoading}
            className="w-full h-10 bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500 text-white font-bold text-sm rounded-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4" />
                {t("auth.signingIn")}
              </span>
            ) : (
              t("auth.login")
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300/50 dark:border-slate-700/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white/80 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400">
              {t("auth.or")}
            </span>
          </div>
        </div>

        {/* Guest Demo Login button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGuestLogin}
          disabled={isLoading || isGuestLoading}
          className="w-full h-10 rounded-xl border-2 border-amber-500/50 dark:border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold text-sm transition-all duration-300 hover:border-amber-500 dark:hover:border-amber-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isGuestLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              {t("auth.signingIn")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4" />
              {t("auth.guestDemo")}
            </span>
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t("auth.guestDemoDescription")}
        </p>
      </div>
    </div>
  );
}
