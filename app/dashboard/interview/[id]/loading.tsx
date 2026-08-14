import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewSessionLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-36 w-full rounded-md" />
          </div>

          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
