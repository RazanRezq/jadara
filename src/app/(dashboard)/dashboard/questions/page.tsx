import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UnderConstruction } from "@/components/under-construction"

export default async function QuestionBankPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    return <UnderConstruction />
}












