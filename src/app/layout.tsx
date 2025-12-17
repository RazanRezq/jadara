import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { LanguageProvider } from "@/i18n/context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
})

// Using CSS @font-face for IBM Plex Sans Arabic to avoid Turbopack font loading issues
// The font is loaded via @import in globals.css

export const metadata: Metadata = {
    title: "GoIELTS - لوحة الإدارة",
    description: "منصة التحضير لاختبار IELTS",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                className={`${outfit.variable} font-sans antialiased`}
                suppressHydrationWarning
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <LanguageProvider defaultLocale="ar">
                        {children}
                        <Toaster />
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
