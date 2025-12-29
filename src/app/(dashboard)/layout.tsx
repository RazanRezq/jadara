import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { cookies } from "next/headers"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Detect direction from locale cookie
    const cookieStore = await cookies()
    const locale = cookieStore.get('locale')?.value || 'ar'
    const direction = locale === 'ar' ? 'rtl' : 'ltr'

    return (
        <div className="[--header-height:3.5rem] bg-background" dir={direction}>
            <SidebarProvider defaultOpen={true} className="flex flex-col">
                <SiteHeader userId={session.userId} />
                <div className="flex flex-1">
                    <AppSidebar user={{
                        name: session.name,
                        email: session.email,
                        role: session.role,
                    }} />
                    <SidebarInset>
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}
