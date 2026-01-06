"use client"

import { useState } from "react"
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
import { Briefcase, MapPin, DollarSign, FileText } from "lucide-react"

// Helper function to detect text direction based on content
const detectTextDirection = (text: string): "rtl" | "ltr" => {
    if (!text) return "ltr"
    // Arabic Unicode range: \u0600-\u06FF
    const arabicRegex = /[\u0600-\u06FF]/
    return arabicRegex.test(text) ? "rtl" : "ltr"
}

const addJobSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]),
    salaryMin: z.string().optional(),
    salaryMax: z.string().optional(),
    status: z.enum(["draft", "active", "closed", "archived"]),
})

type AddJobFormValues = z.infer<typeof addJobSchema>

interface AddJobDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    userId: string
}

export function AddJobDialog({ open, onOpenChange, onSuccess, userId }: AddJobDialogProps) {
    const { t } = useTranslate()
    const [loading, setLoading] = useState(false)

    const form = useForm<AddJobFormValues>({
        resolver: zodResolver(addJobSchema),
        defaultValues: {
            title: "",
            description: "",
            department: "",
            location: "",
            employmentType: "full-time",
            salaryMin: "",
            salaryMax: "",
            status: "draft",
        },
    })

    const onSubmit = async (values: AddJobFormValues) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/jobs/add?userId=${userId}`, {
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
                toast.success(t("jobs.jobCreated"))
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || t("common.error"))
            }
        } catch (error) {
            console.error("Add job error:", error)
            toast.error(t("common.error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("jobs.addNewJob")}</DialogTitle>
                    <DialogDescription>
                        {t("jobs.createNewJobPost")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>{t("jobs.basicInfo")}</span>
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
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
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Location & Department Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{t("jobs.locationDetails")}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
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
                                    render={({ field }) => {
                                        const placeholderText = t("jobs.locationPlaceholder")
                                        const placeholderDir = detectTextDirection(placeholderText)
                                        
                                        return (
                                            <FormItem>
                                                <FormLabel>{t("jobs.location")}</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder={placeholderText}
                                                        dir={placeholderDir}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        {/* Employment Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                <span>{t("jobs.employmentDetails")}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
                                <FormField
                                    control={form.control}
                                    name="employmentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("jobs.employmentType")}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        </div>

                        {/* Salary Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>{t("jobs.salaryRange")}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
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
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? t("jobs.creating") : t("jobs.createJob")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
