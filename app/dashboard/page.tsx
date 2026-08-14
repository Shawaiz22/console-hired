import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "@/modules/dashboard/components/progress-chart";
import { RecentActivity } from "@/modules/dashboard/components/recent-activity";
import { StatsOverview } from "@/modules/dashboard/components/stats-overview";
import { getDashboardStats } from "@/modules/dashboard/utils/get-stats";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  const stats = await getDashboardStats(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            Track your job match progress and upcoming mock interview practice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/interview">Practice Interview</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/analyze">Analyze Resume</Link>
          </Button>
        </div>
      </div>

      <StatsOverview
        resumesAnalyzed={stats.analysisCount}
        interviewsCompleted={stats.completedInterviewCount}
        bestMatchScore={stats.bestMatchScore}
        avgInterviewScore={stats.avgInterviewScore}
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <RecentActivity activities={stats.recentActivities} />
        </div>
        <div className="md:col-span-5">
          <ProgressChart data={stats.scoreHistory} />
        </div>
      </div>
    </div>
  );
}
