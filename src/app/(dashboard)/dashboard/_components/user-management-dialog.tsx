"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import type { UserRole } from "@/lib/auth"

const userFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: z.enum(["superadmin", "admin", "reviewer"]),
    isActive: z.boolean(),
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserManagementDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user?: {
        _id: string
        name: string
        email: string
        role: UserRole
        isActive: boolean
    }
    mode: "create" | "edit"
    onSuccess: () => void
}

export function UserManagementDialog({
    open,
    onOpenChange,
    user,
    mode,
    onSuccess,
}: UserManagementDialogProps) {
    const { t } = useTranslate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<UserFormData>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            password: "",
            role: user?.role || "reviewer",
            isActive: user?.isActive ?? true,
        },
    })

    const onSubmit = async (data: UserFormData) => {
        setIsSubmitting(true)

        try {
            const url = mode === "create" ? "/api/users" : `/api/users/${user?._id}`
            const method = mode === "create" ? "POST" : "PATCH"

            // Remove password if empty in edit mode
            const payload = { ...data }
            if (mode === "edit" && !payload.password) {
                delete payload.password
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (result.success) {
                toast.success(t(mode === "create" ? "users.userCreated" : "users.userUpdated"))
                onSuccess()
                onOpenChange(false)
                form.reset()
            } else {
                toast.error(t("common.error"), {
                    description: result.error || t("users.operationFailed"),
                })
            }
        } catch (error) {
            console.error("Error saving user:", error)
            toast.error(t("common.error"), {
                description: t("users.operationFailed"),
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? t("users.addNewUser") : t("users.editUser")}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? t("users.createTeamMember")
                            : t("users.updateUserInfo")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("users.fullName")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("common.email")}</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("common.password")}
                                        {mode === "edit" && " (leave blank to keep current)"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("common.role")}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="reviewer">
                                                {t("roles.reviewer")}
                                            </SelectItem>
                                            <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                                            <SelectItem value="superadmin">
                                                {t("roles.superadmin")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            {t("users.activeStatus")}
                                        </FormLabel>
                                        <FormDescription>{t("users.allowLogin")}</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? t("common.saving")
                                    : mode === "create"
                                    ? t("users.createUser")
                                    : t("users.saveChanges")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
