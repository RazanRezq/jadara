import { cookies } from "next/headers"

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Read locale from cookies on the server
    const cookieStore = await cookies()
    const locale = cookieStore.get('locale')?.value || 'ar'
    const direction = locale === 'ar' ? 'rtl' : 'ltr'

    return (
        <div dir={direction} className="min-h-screen">
            {children}
        </div>
    )
}














