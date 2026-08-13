import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisResultLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Score Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            <div className="flex justify-center md:col-span-4">
              <Skeleton className="size-36 rounded-full" />
            </div>
            <div className="space-y-4 md:col-span-8">
              <Skeleton className="h-6 w-64" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List Skeleton */}
      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
