"use client"

import { LanguageProvider } from "@/i18n/context"
import { ThemeProvider } from "@/components/theme-provider"

export default function ApplyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <LanguageProvider defaultLocale="ar">
                <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
                    {children}
                </div>
            </LanguageProvider>
        </ThemeProvider>
    )
}


