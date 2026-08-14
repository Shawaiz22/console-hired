import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyzeLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      {/* Stepper Skeleton */}
      <div className="flex items-center justify-center gap-6">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-0.5 w-12" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>

      {/* Card Skeleton */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-44 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
