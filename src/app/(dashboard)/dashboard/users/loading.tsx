import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function UsersLoading() {
    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Skeleton className="h-10 w-full sm:w-64" />
                <div className="flex gap-2 w-full sm:w-auto">
                    <Skeleton className="h-10 flex-1 sm:flex-initial sm:w-32" />
                    <Skeleton className="h-10 flex-1 sm:flex-initial sm:w-32" />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="pt-6">
                    {/* Table header */}
                    <div className="hidden md:flex gap-4 pb-4 border-b">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Table rows */}
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 md:gap-4 p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none">
                                <Skeleton className="h-8 w-full md:w-48" />
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 w-full md:w-32" />
                                <Skeleton className="h-8 w-full md:w-32" />
                                <Skeleton className="h-8 w-20 self-start md:self-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
