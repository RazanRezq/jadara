"use client"

import { useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"

interface DocumentTitleProps {
    titleKey?: string
    fallback?: string
}

export function DocumentTitle({ titleKey = "branding.title", fallback = "GoIELTS" }: DocumentTitleProps) {
    const { t, locale, mounted } = useTranslate()

    useEffect(() => {
        if (mounted) {
            const title = titleKey ? t(titleKey) : fallback
            document.title = title
        }
    }, [locale, mounted, titleKey, fallback, t])

    return null
}
