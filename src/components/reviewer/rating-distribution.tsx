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
                        {/* Quick Insights - Unified Style */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Most Common Rating */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{t("dashboard.reviewer.mostCommon")}</span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">
                                    {mostCommonRating.rating > 0 ? mostCommonRating.rating : '-'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {mostCommonRating.count} {t("dashboard.reviewer.times")}
                                </p>
                            </div>

                            {/* High Ratings */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{t("dashboard.reviewer.highRatings")}</span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">
                                    {highRatingsPercentage}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    4-5 {t("dashboard.reviewer.stars")}
                                </p>
                            </div>
                        </div>

                        {/* Rating Bars */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                            <div className="space-y-3">
                                {allDistributionData.slice().reverse().map((item) => {
                                    const percentage = total > 0 ? Math.round(item.count / total * 100) : 0
                                    const barWidth = maxCount > 0 ? (item.count / maxCount * 100) : 0

                                    return (
                                        <div key={item.rating} className="flex items-center gap-3">
                                            {/* Rating number */}
                                            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10">
                                                <span className="text-xs font-bold text-amber-500">
                                                    {item.rating}
                                                </span>
                                            </div>

                                            {/* Progress Bar Container */}
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="flex-1 h-2.5 bg-muted rounded-md overflow-hidden">
                                                    <div
                                                        className="h-full rounded-md bg-primary transition-all duration-500 ease-out"
                                                        style={{ width: `${barWidth}%`, minWidth: item.count > 0 ? '8px' : '0' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Percentage & Count */}
                                            <div className="flex items-center gap-2 min-w-[60px] justify-end">
                                                <span className="text-xs text-muted-foreground">
                                                    {percentage}%
                                                </span>
                                                <span className="text-xs font-semibold text-foreground w-4 text-right">
                                                    {item.count}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
