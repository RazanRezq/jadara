import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            {/* Settings Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="relative overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="relative z-10">
                            <div className="flex items-start justify-between">
                                <Skeleton className="size-12 rounded-xl" />
                            </div>
                            <Skeleton className="h-6 w-32 mt-4" />
                            <Skeleton className="h-4 w-48 mt-2" />
                            <Skeleton className="h-4 w-40 mt-1" />
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
