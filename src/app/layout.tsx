import type { Metadata } from "next"
import { cookies } from "next/headers"
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
    title: "Jadara - جدارة | Smart Recruitment Platform",
    description: "منصة جدارة الذكية لإدارة التوظيف والموارد البشرية",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // Read locale from cookies on the server
    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value || 'ar') as 'ar' | 'en'
    const direction = locale === 'ar' ? 'rtl' : 'ltr'

    return (
        <html lang={locale} dir={direction} suppressHydrationWarning>
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
                    <LanguageProvider defaultLocale={locale}>
                        {children}
                        <Toaster />
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
