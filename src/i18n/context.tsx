"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react"
import arTranslations from "./locales/ar.json"
import enTranslations from "./locales/en.json"

export type Locale = "ar" | "en"

type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = { [key: string]: TranslationValue }

export interface LanguageContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: Record<string, string | number>) => string
    dir: "rtl" | "ltr"
    isRTL: boolean
    mounted: boolean
}

const translations: Record<Locale, Translations> = {
    ar: arTranslations,
    en: enTranslations,
}

function getNestedValue(obj: Translations, path: string): string {
    const keys = path.split(".")
    let current: TranslationValue = obj

    for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
            current = current[key]
        } else {
            return path
        }
    }

    return typeof current === "string" ? current : path
}

// Default context values
const defaultContextValue: LanguageContextType = {
    locale: "ar",
    setLocale: () => {},
    t: (key: string) => getNestedValue(translations.ar, key),
    dir: "rtl",
    isRTL: true,
    mounted: false,
}

export const LanguageContext = createContext<LanguageContextType>(defaultContextValue)

interface LanguageProviderProps {
    children: ReactNode
    defaultLocale?: Locale
}

export function LanguageProvider({
    children,
    defaultLocale = "ar",
}: LanguageProviderProps) {
    // Initialize state from cookie (passed from server) or default
    const [locale, setLocaleState] = useState<Locale>(defaultLocale)
    const [mounted, setMounted] = useState(false)

    // On mount, sync with server-set direction (no need to set dir - server already did)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Update document attributes when locale changes (user switches language)
    useEffect(() => {
        if (mounted) {
            document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
            document.documentElement.lang = locale
            document.body.dir = locale === "ar" ? "rtl" : "ltr"
        }
    }, [locale, mounted])

    const setLocale = (newLocale: Locale) => {
        // Store in cookie with 1 year expiry
        document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

        // Reload the page to let the server re-render with new direction
        // This ensures SidebarProvider and all layouts remount with correct direction
        window.location.reload()
    }

    const t = (key: string, params?: Record<string, string | number>): string => {
        let translation = getNestedValue(translations[locale], key)

        // Replace {{param}} with actual values
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                translation = translation.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
            })
        }

        return translation
    }

    const value: LanguageContextType = {
        locale,
        setLocale,
        t,
        dir: locale === "ar" ? "rtl" : "ltr",
        isRTL: locale === "ar",
        mounted,
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext)
    return context
}
