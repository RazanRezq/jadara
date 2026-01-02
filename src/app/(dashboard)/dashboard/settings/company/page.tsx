import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { CompanySettingsClient } from "./_components/company-settings-client"

export default async function CompanySettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only superadmin can access company settings
    if (session.role !== "superadmin") {
        redirect("/dashboard")
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <CompanySettingsClient userRole={session.role} />
        </div>
    )
}

