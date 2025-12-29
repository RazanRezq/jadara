'use client'
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PipelineStage {
    name: string
    count: number
    color: string
}

interface HiringPipelineWidgetProps {
    data: {
        stages: PipelineStage[]
    } | null
    loading?: boolean
}

export const HiringPipelineWidget: React.FC<HiringPipelineWidgetProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="space-y-2 rounded-lg border p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        )
    }

    if (!data) {
        return null
    }

    const total = data.stages.reduce((sum, stage) => sum + stage.count, 0)

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Hiring Pipeline
                    </h3>
                    <Target className="h-4 w-4 text-muted-foreground opacity-70" />
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex flex-col gap-3">
                    <div className="text-3xl font-bold">{total}</div>
                    <div className="text-xs text-muted-foreground">Total candidates in pipeline</div>

                    {/* Pipeline Stages */}
                    <div className="space-y-2 mt-2">
                        {data.stages.map((stage, index) => {
                            const percentage = total > 0 ? (stage.count / total) * 100 : 0
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-medium">{stage.name}</span>
                                            <span className="text-muted-foreground">{stage.count}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full transition-all', stage.color)}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
