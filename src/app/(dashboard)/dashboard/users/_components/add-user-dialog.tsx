"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    currentUserRole: UserRole
}

export function AddUserDialog({
    open,
    onOpenChange,
    onSuccess,
    currentUserRole,
}: AddUserDialogProps) {
    const { t, isRTL } = useTranslate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "reviewer" as UserRole,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || t("auth.loginFailed"))
                return
            }

            toast.success(t("users.userCreated"))
            onOpenChange(false)
            onSuccess()
            setFormData({ name: "", email: "", password: "", role: "reviewer" })
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <DialogTitle>{t("users.addNewUser")}</DialogTitle>
                            <DialogDescription>
                                {t("users.createTeamMember")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t("users.fullName")}
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="John Doe"
                            required
                            className={isRTL ? "text-right" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {t("common.email")}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="john@goielts.com"
                            required
                            className={isRTL ? "text-right" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {t("common.password")}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className={isRTL ? "pl-10 text-right" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                                    isRTL ? "left-3" : "right-3"
                                )}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">
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
                            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Spinner className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("users.creating")}
                                </>
                            ) : (
                                t("users.createUser")
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
