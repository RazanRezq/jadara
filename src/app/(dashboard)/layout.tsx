import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { DocumentTitle } from "@/components/document-title"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Read locale from cookies on the server
    const cookieStore = await cookies()
    const locale = cookieStore.get('locale')?.value || 'ar'
    const direction = locale === 'ar' ? 'rtl' : 'ltr'

    return (
        <>
            <DocumentTitle titleKey="branding.title" />
            <div dir={direction} className="[--header-height:3.5rem] min-h-screen w-full bg-background">
                <SidebarProvider key={direction} defaultOpen={true}>
                    <div className="flex min-h-screen w-full flex-col">
                        <SiteHeader userId={session.userId} />
                        <div className="flex flex-1 overflow-hidden">
                            <AppSidebar
                                user={{
                                    name: session.name,
                                    email: session.email,
                                    role: session.role,
                                }}
                                initialDirection={direction}
                            />
                            <SidebarInset>
                                <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:p-6">
                                    {children}
                                </main>
                            </SidebarInset>
                        </div>
                    </div>
                </SidebarProvider>
            </div>
        </>
    )
}
