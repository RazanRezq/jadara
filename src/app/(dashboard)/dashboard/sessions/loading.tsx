import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SessionsLoading() {
    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Skeleton className="h-10 w-full sm:w-48" />
                <Skeleton className="h-10 w-full sm:w-48" />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="pt-6">
                    {/* Table header */}
                    <div className="hidden md:flex gap-4 pb-4 border-b">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Table rows */}
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 md:gap-4 p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none">
                                <Skeleton className="h-8 w-full md:w-48" />
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 w-full md:w-32" />
                                <Skeleton className="h-8 w-full md:w-40" />
                                <Skeleton className="h-8 w-20 self-start md:self-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
