"use client"

import { UseFormReturn } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTranslate } from "@/hooks/useTranslate"
import { JobWizardFormValues, CURRENCY_OPTIONS, DEPARTMENT_OPTIONS } from "./types"

interface Step5ReviewProps {
    form: UseFormReturn<JobWizardFormValues>
}

export function Step5Review({ form }: Step5ReviewProps) {
    const { t, locale } = useTranslate()
    const values = form.getValues()

    const getDepartmentLabel = (value: string) => {
        const dept = DEPARTMENT_OPTIONS.find(d => d.value === value)
        return dept ? (locale === 'ar' ? dept.label : dept.labelEn) : value
    }

    const getCurrencyLabel = (value: string) => {
        const curr = CURRENCY_OPTIONS.find(c => c.value === value)
        return curr ? curr.value : value
    }

    const getEmploymentTypeLabel = (type: string) => {
        switch (type) {
            case 'remote': return t("jobWizard.step1.remote")
            case 'full-time': return t("jobs.fullTime")
            case 'part-time': return t("jobs.partTime")
            case 'contract': return t("jobs.contract")
            case 'internship': return t("jobs.internship")
            default: return type
        }
    }

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-lg font-semibold">{t("jobWizard.step5.title")}</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                    {t("jobWizard.step5.subtitle")}
                </p>
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-5 space-y-5">
                <div>
                    <h3 className="font-semibold text-sm">{t("jobWizard.step5.summary")}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {t("jobWizard.step5.summaryDesc")}
                    </p>
                </div>

                {/* Step 1: Job Basics */}
                <div className="space-y-2.5">
                    <h4 className="text-primary font-medium text-sm">
                        1. {t("jobWizard.step1.title")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step1.jobTitle")}</span>
                            <span className="font-medium">{values.title || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step1.department")}</span>
                            <span className="font-medium">{getDepartmentLabel(values.department || '')}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step1.workType")}</span>
                            <span className="font-medium">{getEmploymentTypeLabel(values.employmentType)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step1.location")}</span>
                            <span className="font-medium">{values.location || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                            <span className="text-muted-foreground">{t("jobs.salary")}</span>
                            <span className="font-medium">
                                {values.salaryMin && values.salaryMax
                                    ? `${values.salaryMin} - ${values.salaryMax} ${getCurrencyLabel(values.currency)}`
                                    : '-'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Step 2: Evaluation Criteria */}
                <div className="space-y-2.5">
                    <h4 className="text-primary font-medium text-sm">
                        2. {t("jobWizard.step2.title")}
                    </h4>

                    {/* Skills */}
                    {values.skills.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-xs text-muted-foreground block">
                                {t("jobWizard.step2.skillsMatrix")}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {values.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant={skill.importance === 'required' ? 'default' : 'outline'}
                                        className="text-xs px-2 py-0.5"
                                    >
                                        {skill.name} · {skill.importance === 'required'
                                            ? t("jobWizard.step2.required")
                                            : t("jobWizard.step2.preferred")
                                        }
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs pt-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step2.experienceReqs")}</span>
                            <span className="font-medium">
                                {values.minExperience} {t("applicants.years")}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step2.autoRejectThreshold")}</span>
                            <span className="font-medium">
                                {t("jobWizard.step5.lessThan")} {values.autoRejectThreshold}%
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Step 3: Candidate Data */}
                <div className="space-y-2.5">
                    <h4 className="text-primary font-medium text-sm">
                        3. {t("jobWizard.step3.title")}
                    </h4>

                    <div className="text-xs space-y-2">
                        <div>
                            <span className="text-muted-foreground block mb-1">{t("jobWizard.step5.requiredData")}</span>
                            <ul className="list-disc ps-4 space-y-0.5">
                                {values.candidateDataConfig.requireCV && (
                                    <li>{t("jobWizard.step3.cv")}</li>
                                )}
                                {values.candidateDataConfig.requireLinkedIn && (
                                    <li>{t("jobWizard.step3.linkedin")}</li>
                                )}
                                {values.candidateDataConfig.requirePortfolio && (
                                    <li>{t("jobWizard.step3.portfolio")}</li>
                                )}
                            </ul>
                        </div>

                        {(values.candidateDataConfig.hideSalaryExpectation ||
                          values.candidateDataConfig.hidePersonalInfo) && (
                            <div>
                                <span className="text-muted-foreground block mb-1">{t("jobWizard.step5.hiddenFromReviewers")}</span>
                                <ul className="list-disc ps-4 space-y-0.5">
                                    {values.candidateDataConfig.hideSalaryExpectation && (
                                        <li>{t("jobWizard.step3.hideSalary")}</li>
                                    )}
                                    {values.candidateDataConfig.hidePersonalInfo && (
                                        <li>{t("jobWizard.step3.hidePersonalInfo")}</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Step 4: Exam Builder */}
                <div className="space-y-2.5">
                    <h4 className="text-primary font-medium text-sm">
                        4. {t("jobWizard.step4.title")}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step5.questionsCount")}</span>
                            <span className="font-medium">{values.questions.length}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">{t("jobWizard.step5.retakeAllowed")}</span>
                            <span className="font-medium">
                                {values.retakePolicy.allowRetake
                                    ? `${t("common.yes")} (${values.retakePolicy.maxAttempts} ${t("jobWizard.step5.attempts")})`
                                    : t("common.no")
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}













