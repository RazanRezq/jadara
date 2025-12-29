import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EditJobLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Page Header */}
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            {/* Form Sections */}
            {[1, 2, 3, 4].map((section) => (
                <Card key={section}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map((field) => (
                            <div key={field} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    )
}
