import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses, interviewSessions } from "@/lib/db/schema";
import { HistoryList } from "@/modules/dashboard/components/history-list";
import fixtureAnalysis from "@/modules/analysis/fixtures/analysis.json";

export default async function HistoryPage() {
  const user = await requireUser();

  const userAnalyses = await db.query.analyses.findMany({
    where: eq(analyses.userId, user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const userInterviews = await db.query.interviewSessions.findMany({
    where: eq(interviewSessions.userId, user.id),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const allItems = [
    ...userAnalyses.map((a) => ({
      id: a.id,
      type: "analysis" as const,
      title: "Resume Analysis",
      score: a.overallScore ?? fixtureAnalysis.overallScore,
      createdAt: a.createdAt,
      href: `/dashboard/analysis/${a.id}`,
    })),
    ...userInterviews.map((i) => ({
      id: i.id,
      type: "interview" as const,
      title: "Mock Interview Session",
      score: i.overallScore ?? 84,
      createdAt: i.createdAt,
      href: `/dashboard/interview/${i.id}`,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Full History</h1>
        <p className="text-sm text-muted-foreground">
          View all your past resume match analyses and mock interview feedback sessions.
        </p>
      </div>

      <HistoryList items={allItems} />
    </div>
  );
}
