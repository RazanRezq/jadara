import type { Metadata } from "next"
import { Outfit, IBM_Plex_Sans_Arabic } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { LanguageProvider } from "@/i18n/context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
})

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
    variable: "--font-ibm-arabic",
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["arabic"],
    display: "swap",
    fallback: ["system-ui", "sans-serif"],
})

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
            <body
                className={`${outfit.variable} ${ibmPlexArabic.variable} font-sans antialiased`}
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
