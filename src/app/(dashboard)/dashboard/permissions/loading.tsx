import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PermissionsLoading() {
    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            {/* Role Tabs */}
            <div className="flex gap-2 border-b pb-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-9 w-32" />
                ))}
            </div>

            {/* Permissions Table */}
            <Card>
                <CardContent className="pt-6">
                    {/* Table header */}
                    <div className="hidden md:flex gap-4 pb-4 border-b">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>

                    {/* Table rows */}
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 md:gap-4 p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none">
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 w-full md:w-24" />
                                <Skeleton className="h-8 w-full md:w-24" />
                                <Skeleton className="h-8 w-full md:w-24" />
                                <Skeleton className="h-8 w-full md:w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    )
}
