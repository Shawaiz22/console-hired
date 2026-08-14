import { and, asc, count, desc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyses, interviewSessions, jobDescriptions, resumes } from "@/lib/db/schema";

export async function getDashboardStats(userId: string) {
  const [
    resumeCountRes,
    analysisCountRes,
    interviewCountRes,
    bestAnalysisScoreRes,
    bestInterviewScoreRes,
    recentAnalysesRaw,
    recentSessionsRaw,
    completedAnalyses,
    completedInterviews,
    completedInterviewCountRes,
    interviewScoresRes,
  ] = await Promise.all([
    db.select({ count: count() }).from(resumes).where(eq(resumes.userId, userId)),

    db.select({ count: count() }).from(analyses).where(eq(analyses.userId, userId)),

    db
      .select({ count: count() })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId)),

    db
      .select({ maxScore: max(analyses.overallScore) })
      .from(analyses)
      .where(and(eq(analyses.userId, userId), eq(analyses.status, "complete"))),

    db
      .select({ maxScore: max(interviewSessions.overallScore) })
      .from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed"))),

    // Last 5 analyses with explicit columns
    db
      .select({
        id: analyses.id,
        overallScore: analyses.overallScore,
        jobTitle: jobDescriptions.title,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .leftJoin(jobDescriptions, eq(analyses.jobDescriptionId, jobDescriptions.id))
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
      .limit(5),

    // Last 5 interview sessions with explicit columns
    db
      .select({
        id: interviewSessions.id,
        overallScore: interviewSessions.overallScore,
        jobTitle: jobDescriptions.title,
        startedAt: interviewSessions.createdAt,
      })
      .from(interviewSessions)
      .leftJoin(jobDescriptions, eq(interviewSessions.jobDescriptionId, jobDescriptions.id))
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.createdAt))
      .limit(5),

    // Historical analysis scores for the timeline chart
    db
      .select({
        overallScore: analyses.overallScore,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .where(and(eq(analyses.userId, userId), eq(analyses.status, "complete")))
      .orderBy(asc(analyses.createdAt))
      .limit(20),

    // Historical interview scores for the timeline chart
    db
      .select({
        overallScore: interviewSessions.overallScore,
        createdAt: interviewSessions.createdAt,
      })
      .from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed")))
      .orderBy(asc(interviewSessions.createdAt))
      .limit(20),

    db
      .select({ count: count() })
      .from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed"))),

    db
      .select({ overallScore: interviewSessions.overallScore })
      .from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, "completed"))),
  ]);

  const resumeCount = resumeCountRes[0]?.count ?? 0;
  const analysisCount = analysisCountRes[0]?.count ?? 0;
  const interviewCount = interviewCountRes[0]?.count ?? 0;
  const completedInterviewCount = completedInterviewCountRes[0]?.count ?? 0;

  const maxAnalysisScore = bestAnalysisScoreRes[0]?.maxScore ?? null;
  const maxInterviewScore = bestInterviewScoreRes[0]?.maxScore ?? null;
  const bestScore =
    maxAnalysisScore !== null && maxInterviewScore !== null
      ? Math.max(maxAnalysisScore, maxInterviewScore)
      : (maxAnalysisScore ?? maxInterviewScore ?? 0);

  const validInterviewScores = interviewScoresRes
    .map((i) => i.overallScore)
    .filter((s): s is number => typeof s === "number");

  const avgInterviewScore =
    validInterviewScores.length > 0
      ? Math.round(validInterviewScores.reduce((a, b) => a + b, 0) / validInterviewScores.length)
      : 0;

  const recentAnalyses = recentAnalysesRaw.map((item) => ({
    id: item.id,
    overallScore: item.overallScore,
    jobTitle: item.jobTitle ?? "Untitled Position",
    createdAt: item.createdAt,
  }));

  const recentSessions = recentSessionsRaw.map((item) => ({
    id: item.id,
    overallScore: item.overallScore,
    jobTitle: item.jobTitle ?? "Untitled Position",
    startedAt: item.startedAt,
  }));

  // Aggregate historical scores grouped by date for dashboard timeline chart
  const historyMap = new Map<
    string,
    { date: string; matchScore: number | null; interviewScore: number | null }
  >();

  for (const a of completedAnalyses) {
    if (a.createdAt && a.overallScore !== null) {
      const dateKey = a.createdAt.toISOString().split("T")[0];
      const existing = historyMap.get(dateKey) ?? {
        date: dateKey,
        matchScore: null,
        interviewScore: null,
      };
      existing.matchScore = a.overallScore;
      historyMap.set(dateKey, existing);
    }
  }

  for (const i of completedInterviews) {
    if (i.createdAt && i.overallScore !== null) {
      const dateKey = i.createdAt.toISOString().split("T")[0];
      const existing = historyMap.get(dateKey) ?? {
        date: dateKey,
        matchScore: null,
        interviewScore: null,
      };
      existing.interviewScore = i.overallScore;
      historyMap.set(dateKey, existing);
    }
  }

  const scoreHistory = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const recentActivities = [
    ...recentAnalysesRaw.map((a) => ({
      id: a.id,
      type: "analysis" as const,
      title: "Resume Analysis",
      score: a.overallScore,
      createdAt: a.createdAt,
      href: `/dashboard/analysis/${a.id}`,
    })),
    ...recentSessionsRaw.map((i) => ({
      id: i.id,
      type: "interview" as const,
      title: "Mock Interview Session",
      score: i.overallScore,
      createdAt: i.startedAt,
      href: `/dashboard/interview/${i.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    resumeCount,
    analysisCount,
    interviewCount,
    completedInterviewCount,
    bestScore,
    bestMatchScore: maxAnalysisScore ?? 0,
    avgInterviewScore,
    recentAnalyses,
    recentSessions,
    recentActivities,
    scoreHistory,
  };
}
