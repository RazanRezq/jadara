"use client"

import { useLanguage, type LanguageContextType } from "@/i18n/context"

export function useTranslate(): LanguageContextType {
    return useLanguage()
}
