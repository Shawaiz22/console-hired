import Link from "next/link";
import { ArrowRight, FileText, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./empty-state";

export interface ActivityItem {
  id: string;
  type: "analysis" | "interview";
  title: string;
  score: number;
  createdAt: string | Date;
  href: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Upload your resume and a job description to get started with your first analysis."
        action={
          <Button asChild>
            <Link href="/dashboard/analyze">Analyze Resume</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/dashboard/history">
            View All
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((item) => {
          const isAnalysis = item.type === "analysis";
          const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isAnalysis ? <FileText className="size-4" /> : <Video className="size-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isAnalysis ? "Resume Match Analysis" : "Mock Interview"} • {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {item.score}% Score
                </Badge>
                <ArrowRight className="size-4 text-muted-foreground/60" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
