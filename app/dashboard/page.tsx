import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses, interviewSessions } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ProgressChart, type ChartDataPoint } from "@/modules/dashboard/components/progress-chart";
import { RecentActivity } from "@/modules/dashboard/components/recent-activity";
import { StatsOverview } from "@/modules/dashboard/components/stats-overview";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  const userAnalyses = await db.query.analyses.findMany({
    where: eq(analyses.userId, user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const userInterviews = await db.query.interviewSessions.findMany({
    where: eq(interviewSessions.userId, user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const resumesAnalyzed = userAnalyses.length;
  const completedInterviews = userInterviews.filter((i) => i.status === "completed");
  const interviewsCompleted = completedInterviews.length;

  const analysisScores = userAnalyses
    .map((a) => a.overallScore)
    .filter((s): s is number => typeof s === "number");
  const bestMatchScore = analysisScores.length > 0 ? Math.max(...analysisScores) : 0;

  const interviewScores = completedInterviews
    .map((i) => i.overallScore)
    .filter((s): s is number => typeof s === "number");
  const avgInterviewScore =
    interviewScores.length > 0
      ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
      : 0;

  const recentActivities = [
    ...userAnalyses.map((a) => ({
      id: a.id,
      type: "analysis" as const,
      title: "Resume Analysis",
      score: a.overallScore,
      createdAt: a.createdAt,
      href: `/dashboard/analysis/${a.id}`,
    })),
    ...userInterviews.map((i) => ({
      id: i.id,
      type: "interview" as const,
      title: "Mock Interview Session",
      score: i.overallScore,
      createdAt: i.createdAt,
      href: `/dashboard/interview/${i.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Real score history keyed by the day each score was recorded. Days without a
  // score stay null so the chart gaps instead of showing invented progress.
  const historyByDate = new Map<string, ChartDataPoint>();

  function pointFor(date: Date) {
    const key = date.toISOString().split("T")[0];
    const existing = historyByDate.get(key);
    if (existing) return existing;

    const created: ChartDataPoint = { date: key, matchScore: null, interviewScore: null };
    historyByDate.set(key, created);
    return created;
  }

  for (const a of userAnalyses) {
    if (a.createdAt && a.overallScore !== null) {
      pointFor(a.createdAt).matchScore = a.overallScore;
    }
  }

  for (const i of completedInterviews) {
    if (i.createdAt && i.overallScore !== null) {
      pointFor(i.createdAt).interviewScore = i.overallScore;
    }
  }

  const trendData = Array.from(historyByDate.values()).sort((a, b) => a.date.localeCompare(b.date));

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
        resumesAnalyzed={resumesAnalyzed}
        interviewsCompleted={interviewsCompleted}
        bestMatchScore={bestMatchScore}
        avgInterviewScore={avgInterviewScore}
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <RecentActivity activities={recentActivities} />
        </div>
        <div className="md:col-span-5">
          <ProgressChart data={trendData} />
        </div>
      </div>
    </div>
  );
}
