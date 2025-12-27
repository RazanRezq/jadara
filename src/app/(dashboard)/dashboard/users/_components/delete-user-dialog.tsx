"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
    id: string
    email: string
    name: string
}

interface DeleteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User
    onSuccess: () => void
}

export function DeleteUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
}: DeleteUserDialogProps) {
    const { t, isRTL } = useTranslate()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)

        try {
            const response = await fetch(`/api/users/delete/${user.id}`, {
                method: "DELETE",
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || t("auth.loginFailed"))
                return
            }

            toast.success(t("users.userDeleted"))
            onOpenChange(false)
            onSuccess()
        } catch {
            toast.error(t("auth.loginFailed"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="text-start">
                            <DialogTitle>{t("users.deleteUser")}</DialogTitle>
                            <DialogDescription>
                                {t("users.deleteWarning")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 text-start">
                    <p>
                        {t("users.confirmDelete")}{" "}
                        <span className="font-semibold">{user.name}</span>؟
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {t("users.permanentlyRemove")}
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner className="h-4 w-4 me-2" />
                                {t("users.deleting")}
                            </>
                        ) : (
                            t("users.deleteUser")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
