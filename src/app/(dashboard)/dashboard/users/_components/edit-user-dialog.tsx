"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { type UserRole } from "@/lib/auth"
import { hasPermission } from "@/lib/authClient"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface User {
    id: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
}

interface EditUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User
    onSuccess: () => void
    currentUserRole: UserRole
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
    currentUserRole,
}: EditUserDialogProps) {
    const { t } = useTranslate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
    })

    useEffect(() => {
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        })
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`/api/users/update/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || t("auth.loginFailed"))
                return
            }

            toast.success(t("users.userUpdated"))
            onOpenChange(false)
            onSuccess()
        } catch {
            toast.error(t("auth.loginFailed"))
        } finally {
            setLoading(false)
        }
    }

    const availableRoles: { value: UserRole; labelKey: string }[] = [
        { value: "reviewer", labelKey: "roles.reviewer" },
        { value: "admin", labelKey: "roles.admin" },
        ...(hasPermission(currentUserRole, "superadmin")
            ? [{ value: "superadmin" as UserRole, labelKey: "roles.superadmin" }]
            : []),
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-start">
                            <DialogTitle>{t("users.editUser")}</DialogTitle>
                            <DialogDescription>
                                {t("users.updateUserInfo")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">
                            {t("users.fullName")}
                        </Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            className="text-start"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-email">
                            {t("common.email")}
                        </Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            required
                            className="text-start"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-role">
                            {t("common.role")}
                        </Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value: UserRole) =>
                                setFormData({ ...formData, role: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {t(role.labelKey)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div className="text-start">
                            <Label htmlFor="edit-active">
                                {t("users.activeStatus")}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t("users.allowLogin")}
                            </p>
                        </div>
                        <Switch
                            id="edit-active"
                            checked={formData.isActive}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isActive: checked })
                            }
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Spinner className="h-4 w-4 me-2" />
                                    {t("users.saving")}
                                </>
                            ) : (
                                t("users.saveChanges")
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
