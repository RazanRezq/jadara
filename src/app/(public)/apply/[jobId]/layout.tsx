import { cookies } from "next/headers"
import { LanguageProvider } from "@/i18n/context"
import { ThemeProvider } from "@/components/theme-provider"

export default async function ApplyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Read locale from cookies on the server
    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value || 'ar') as 'ar' | 'en'
    const direction = locale === 'ar' ? 'rtl' : 'ltr'

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <LanguageProvider defaultLocale={locale}>
                <div dir={direction} className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
                    {children}
                </div>
            </LanguageProvider>
        </ThemeProvider>
    )
}










