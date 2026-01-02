"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslate } from "@/hooks/useTranslate"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useTranslate()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                >
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-[#16161d] border-white/10"
            >
                <DropdownMenuItem
                    onClick={() => setLocale("ar")}
                    className={`cursor-pointer ${
                        locale === "ar"
                            ? "text-cyan-400 bg-cyan-500/10"
                            : "text-slate-300 focus:text-white focus:bg-white/5"
                    }`}
                >
                    <span className="font-medium">{t("language.arabic")}</span>
                    {locale === "ar" && (
                        <span className="ms-auto text-cyan-400">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className={`cursor-pointer ${
                        locale === "en"
                            ? "text-cyan-400 bg-cyan-500/10"
                            : "text-slate-300 focus:text-white focus:bg-white/5"
                    }`}
                >
                    <span className="font-medium">{t("language.english")}</span>
                    {locale === "en" && (
                        <span className="ms-auto text-cyan-400">✓</span>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}













