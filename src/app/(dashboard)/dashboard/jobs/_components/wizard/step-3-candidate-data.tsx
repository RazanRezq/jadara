"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormDescription,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues } from "./types"
import { FileText, Linkedin, Briefcase, EyeOff, UserX } from "lucide-react"

interface Step3CandidateDataProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step3CandidateData({ form }: Step3CandidateDataProps) {
    const { t } = useTranslate()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-xl font-semibold">{t("jobWizard.step3.title")}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    {t("jobWizard.step3.subtitle")}
                </p>
            </div>

            {/* Application Form Configuration */}
            <div className="space-y-4">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step3.formConfig")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("jobWizard.step3.formConfigDesc")}
                    </p>
                </div>

                <div className="space-y-3">
                    {/* CV Toggle */}
                    <FormField
                        control={form.control}
                        name="candidateDataConfig.requireCV"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                            {t("jobWizard.step3.cv")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("jobWizard.step3.cvDesc")}
                                        </FormDescription>
                                    </div>
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

                    {/* LinkedIn Toggle */}
                    <FormField
                        control={form.control}
                        name="candidateDataConfig.requireLinkedIn"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Linkedin className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                            {t("jobWizard.step3.linkedin")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("jobWizard.step3.linkedinDesc")}
                                        </FormDescription>
                                    </div>
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

                    {/* Portfolio Toggle */}
                    <FormField
                        control={form.control}
                        name="candidateDataConfig.requirePortfolio"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                            {t("jobWizard.step3.portfolio")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("jobWizard.step3.portfolioDesc")}
                                        </FormDescription>
                                    </div>
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
                </div>
            </div>

            {/* Blind Review Settings */}
            <div className="space-y-4 border-t pt-6">
                <div className="text-end">
                    <h3 className="font-semibold">{t("jobWizard.step3.blindReview")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("jobWizard.step3.blindReviewDesc")}
                    </p>
                </div>

                <div className="space-y-3">
                    {/* Hide Salary Expectation */}
                    <FormField
                        control={form.control}
                        name="candidateDataConfig.hideSalaryExpectation"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <EyeOff className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                            {t("jobWizard.step3.hideSalary")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("jobWizard.step3.hideSalaryDesc")}
                                        </FormDescription>
                                    </div>
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

                    {/* Hide Personal Info */}
                    <FormField
                        control={form.control}
                        name="candidateDataConfig.hidePersonalInfo"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                        <UserX className="h-5 w-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <FormLabel className="text-base font-medium cursor-pointer">
                                            {t("jobWizard.step3.hidePersonalInfo")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("jobWizard.step3.hidePersonalInfoDesc")}
                                        </FormDescription>
                                    </div>
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
                </div>
            </div>
        </div>
    )
}





