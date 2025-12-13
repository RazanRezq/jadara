"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import type { Job } from "./jobs-client"

const editJobSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]),
    salaryMin: z.string().optional(),
    salaryMax: z.string().optional(),
    status: z.enum(["draft", "active", "closed", "archived"]),
})

type EditJobFormValues = z.infer<typeof editJobSchema>

interface EditJobDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    job: Job
    onSuccess: () => void
    userId: string
}

export function EditJobDialog({ open, onOpenChange, job, onSuccess, userId }: EditJobDialogProps) {
    const { t } = useTranslate()
    const [loading, setLoading] = useState(false)

    const form = useForm<EditJobFormValues>({
        resolver: zodResolver(editJobSchema),
        defaultValues: {
            title: job.title,
            description: job.description,
            department: job.department || "",
            location: job.location || "",
            employmentType: job.employmentType,
            salaryMin: job.salaryMin?.toString() || "",
            salaryMax: job.salaryMax?.toString() || "",
            status: job.status,
        },
    })

    useEffect(() => {
        form.reset({
            title: job.title,
            description: job.description,
            department: job.department || "",
            location: job.location || "",
            employmentType: job.employmentType,
            salaryMin: job.salaryMin?.toString() || "",
            salaryMax: job.salaryMax?.toString() || "",
            status: job.status,
        })
    }, [job, form])

    const onSubmit = async (values: EditJobFormValues) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/jobs/update/${job.id}?userId=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    salaryMin: values.salaryMin ? parseInt(values.salaryMin) : undefined,
                    salaryMax: values.salaryMax ? parseInt(values.salaryMax) : undefined,
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(t("jobs.jobUpdated"))
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Edit job error:", error)
            toast.error(t("common.error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("jobs.editJob")}</DialogTitle>
                    <DialogDescription>
                        {t("jobs.updateJobDetails")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("jobs.jobTitle")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("jobs.titlePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("jobs.description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("jobs.descriptionPlaceholder")}
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("jobs.department")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("jobs.departmentPlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("jobs.location")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("jobs.locationPlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employmentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("jobs.employmentType")}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="full-time">{t("jobs.fullTime")}</SelectItem>
                                                <SelectItem value="part-time">{t("jobs.partTime")}</SelectItem>
                                                <SelectItem value="contract">{t("jobs.contract")}</SelectItem>
                                                <SelectItem value="internship">{t("jobs.internship")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("common.status")}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">{t("jobs.status.draft")}</SelectItem>
                                                <SelectItem value="active">{t("jobs.status.active")}</SelectItem>
                                                <SelectItem value="closed">{t("jobs.status.closed")}</SelectItem>
                                                <SelectItem value="archived">{t("jobs.status.archived")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="salaryMin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("jobs.salaryMin")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="salaryMax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("jobs.salaryMax")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? t("users.saving") : t("users.saveChanges")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
