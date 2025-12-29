import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ApplicantsLoading() {
    return (
        <div className="dashboard-container space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="size-8 rounded-md" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Kanban Board / Table Hybrid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((col) => (
                    <div key={col} className="space-y-3">
                        {/* Column Header */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="size-5 rounded-full" />
                        </div>

                        {/* Cards */}
                        <div className="space-y-3">
                            {[1, 2, 3].map((card) => (
                                <Card key={card}>
                                    <CardContent className="pt-6 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="size-6 rounded-md" />
                                        </div>
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-full" />
                                        <div className="flex gap-2 pt-2">
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
