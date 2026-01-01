"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, TrendingUp } from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"

interface RatingDistributionData {
    rating: number
    count: number
}

interface RatingDistributionProps {
    reviewerId: string
    initialData?: {
        distribution: RatingDistributionData[]
        total: number
    }
    avgRating?: number
}

export function RatingDistribution({ reviewerId, initialData, avgRating = 0 }: RatingDistributionProps) {
    const { t, isRTL } = useTranslate()
    const [data, setData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(!initialData)

    // Fetch rating distribution data
    const fetchRatingDistribution = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/reviews/rating-distribution?reviewerId=${reviewerId}`)
            const result = await response.json()

            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Error fetching rating distribution:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!initialData) {
            fetchRatingDistribution()
        }
    }, [reviewerId, initialData])

    const total = data?.total || 0
    const allDistributionData = data?.distribution || []

    // Calculate max count for bar width percentage
    const maxCount = Math.max(...allDistributionData.map(item => item.count), 1)

    // Find most common rating
    const mostCommonRating = allDistributionData.reduce((prev, current) =>
        (current.count > prev.count) ? current : prev
    , { rating: 0, count: 0 })

    // Calculate high ratings percentage (4-5 stars)
    const highRatingsCount = allDistributionData
        .filter(item => item.rating >= 4)
        .reduce((sum, item) => sum + item.count, 0)
    const highRatingsPercentage = total > 0 ? Math.round((highRatingsCount / total) * 100) : 0

    // Get rating color
    const getRatingColor = (rating: number) => {
        const colors = {
            5: "bg-emerald-500",
            4: "bg-blue-500",
            3: "bg-amber-500",
            2: "bg-white dark:bg-gray-300",
            1: "bg-rose-500",
        }
        return colors[rating as keyof typeof colors] || "bg-gray-500"
    }

    const getStarColor = (rating: number) => {
        const colors = {
            5: "text-emerald-500",
            4: "text-blue-500",
            3: "text-amber-500",
            2: "text-white dark:text-gray-300",
            1: "text-rose-500",
        }
        return colors[rating as keyof typeof colors] || "text-gray-500"
    }

    return (
        <Card className="rounded-2xl h-full border shadow-sm bg-card">
            <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className={cn("text-lg font-bold text-foreground", isRTL ? "text-right" : "text-left")}>
                            {t("dashboard.reviewer.myRatingDistribution")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t("dashboard.reviewer.trackYourReviews")}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[240px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : total === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[240px] space-y-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Star className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-semibold text-foreground">
                                {t("dashboard.reviewer.noReviewsYet")}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                {t("dashboard.reviewer.startReviewingToSeeDistribution")}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Quick Insights */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Most Common Rating */}
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-current" />
                                    <span className="text-xs font-medium text-amber-900 dark:text-amber-100">{t("dashboard.reviewer.mostCommon")}</span>
                                </div>
                                <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                    {mostCommonRating.rating > 0 ? mostCommonRating.rating : '-'}
                                </div>
                                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                                    {mostCommonRating.count} {t("dashboard.reviewer.times")}
                                </p>
                            </div>

                            {/* High Ratings */}
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">{t("dashboard.reviewer.highRatings")}</span>
                                </div>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {highRatingsPercentage}%
                                </div>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                    4-5 {t("dashboard.reviewer.stars")}
                                </p>
                            </div>
                        </div>

                        {/* Horizontal Bar Chart */}
                        <div className="space-y-3">
                            {allDistributionData.slice().reverse().map((item) => {
                                const percentage = total > 0 ? (item.count / total * 100).toFixed(0) : 0
                                const barWidth = maxCount > 0 ? (item.count / maxCount * 100) : 0

                                return (
                                    <div key={item.rating} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Star className={cn("w-4 h-4 fill-current", getStarColor(item.rating))} />
                                                <span className="font-medium text-foreground">
                                                    {item.rating} {t('dashboard.reviewer.stars')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {percentage}%
                                                </span>
                                                <span className="font-bold text-foreground min-w-[2rem] text-right">
                                                    {item.count}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500 ease-out", getRatingColor(item.rating))}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
