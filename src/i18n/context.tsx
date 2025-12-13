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
    t: (key: string) => string
    dir: "rtl" | "ltr"
    isRTL: boolean
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
    const [locale, setLocaleState] = useState<Locale>(defaultLocale)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedLocale = localStorage.getItem("locale") as Locale | null
        if (savedLocale && (savedLocale === "ar" || savedLocale === "en")) {
            setLocaleState(savedLocale)
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
            document.documentElement.lang = locale
        }
    }, [locale, mounted])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem("locale", newLocale)
    }

    const t = (key: string): string => {
        return getNestedValue(translations[locale], key)
    }

    const value: LanguageContextType = {
        locale,
        setLocale,
        t,
        dir: locale === "ar" ? "rtl" : "ltr",
        isRTL: locale === "ar",
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
