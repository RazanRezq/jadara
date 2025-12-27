"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/useTranslate"
import { CheckCircle2, Clock, Play } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ReviewerStats {
    pendingReviews: number
    completedReviews: number
    evaluationQueue: Array<{
        _id: string
        candidateRef: string
        jobTitle: string
        dateAssigned: Date
    }>
}

interface ReviewerViewProps {
    stats: ReviewerStats
}

export function ReviewerView({ stats }: ReviewerViewProps) {
    const { t } = useTranslate()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.reviewer.title")}</h1>
                <p className="text-muted-foreground mt-1">{t("dashboard.reviewer.subtitle")}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.reviewer.pendingReviews")}
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("dashboard.reviewer.awaitingYourReview")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.reviewer.completedReviews")}
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedReviews}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("dashboard.reviewer.totalCompleted")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Evaluation Queue */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.reviewer.evaluationQueue")}</CardTitle>
                    <CardDescription>{t("dashboard.reviewer.evaluationQueueDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.evaluationQueue.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-medium">{t("dashboard.reviewer.allCaughtUp")}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("dashboard.reviewer.noReviewsPending")}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("dashboard.reviewer.candidateRef")}</TableHead>
                                        <TableHead>{t("dashboard.reviewer.jobTitle")}</TableHead>
                                        <TableHead>{t("dashboard.reviewer.dateAssigned")}</TableHead>
                                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.evaluationQueue.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell className="font-medium">
                                                {item.candidateRef}
                                            </TableCell>
                                            <TableCell>{item.jobTitle}</TableCell>
                                            <TableCell>
                                                {new Date(item.dateAssigned).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Link href={`/dashboard/applicants/${item._id}`}>
                                                    <Button size="sm" className="gap-2">
                                                        <Play className="w-4 h-4" />
                                                        {t("dashboard.reviewer.startEvaluation")}
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Blind Hiring Notice */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                        {t("dashboard.reviewer.blindHiringNotice")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        {t("dashboard.reviewer.blindHiringDescription")}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
