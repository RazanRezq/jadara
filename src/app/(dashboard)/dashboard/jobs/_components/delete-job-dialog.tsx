"use client"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import type { Job } from "./jobs-client"

interface DeleteJobDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    job: Job
    onSuccess: () => void
    userId: string
}

export function DeleteJobDialog({ open, onOpenChange, job, onSuccess, userId }: DeleteJobDialogProps) {
    const { t } = useTranslate()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/jobs/delete/${job.id}?userId=${userId}`, {
                method: "DELETE",
            })

            const data = await response.json()

            if (data.success) {
                toast.success(t("jobs.jobDeleted"))
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Delete job error:", error)
            toast.error(t("common.error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("jobs.deleteJob")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("jobs.confirmDelete")} <strong>{job.title}</strong>?{" "}
                        {t("jobs.permanentlyRemove")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                    >
                        {loading ? t("users.deleting") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
