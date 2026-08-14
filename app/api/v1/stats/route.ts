import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, max } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses, interviewSessions, jobDescriptions, resumes } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run count queries and max queries concurrently for maximum performance
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
    ] = await Promise.all([
      db.select({ count: count() }).from(resumes).where(eq(resumes.userId, user.id)),

      db.select({ count: count() }).from(analyses).where(eq(analyses.userId, user.id)),

      db
        .select({ count: count() })
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, user.id)),

      db
        .select({ maxScore: max(analyses.overallScore) })
        .from(analyses)
        .where(and(eq(analyses.userId, user.id), eq(analyses.status, "complete"))),

      db
        .select({ maxScore: max(interviewSessions.overallScore) })
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, user.id)),

      // Last 5 analyses with explicit columns only
      db
        .select({
          id: analyses.id,
          overallScore: analyses.overallScore,
          jobTitle: jobDescriptions.title,
          createdAt: analyses.createdAt,
        })
        .from(analyses)
        .leftJoin(jobDescriptions, eq(analyses.jobDescriptionId, jobDescriptions.id))
        .where(eq(analyses.userId, user.id))
        .orderBy(desc(analyses.createdAt))
        .limit(5),

      // Last 5 interview sessions with explicit columns only
      db
        .select({
          id: interviewSessions.id,
          overallScore: interviewSessions.overallScore,
          jobTitle: jobDescriptions.title,
          startedAt: interviewSessions.createdAt,
        })
        .from(interviewSessions)
        .leftJoin(jobDescriptions, eq(interviewSessions.jobDescriptionId, jobDescriptions.id))
        .where(eq(interviewSessions.userId, user.id))
        .orderBy(desc(interviewSessions.createdAt))
        .limit(5),

      // Historical analysis scores for the timeline chart
      db
        .select({
          overallScore: analyses.overallScore,
          createdAt: analyses.createdAt,
        })
        .from(analyses)
        .where(and(eq(analyses.userId, user.id), eq(analyses.status, "complete")))
        .orderBy(asc(analyses.createdAt))
        .limit(20),

      // Historical interview scores for the timeline chart
      db
        .select({
          overallScore: interviewSessions.overallScore,
          createdAt: interviewSessions.createdAt,
        })
        .from(interviewSessions)
        .where(
          and(eq(interviewSessions.userId, user.id), eq(interviewSessions.status, "completed"))
        )
        .orderBy(asc(interviewSessions.createdAt))
        .limit(20),
    ]);

    const resumeCount = resumeCountRes[0]?.count ?? 0;
    const analysisCount = analysisCountRes[0]?.count ?? 0;
    const interviewCount = interviewCountRes[0]?.count ?? 0;

    const maxAnalysisScore = bestAnalysisScoreRes[0]?.maxScore ?? null;
    const maxInterviewScore = bestInterviewScoreRes[0]?.maxScore ?? null;
    const bestScore =
      maxAnalysisScore !== null && maxInterviewScore !== null
        ? Math.max(maxAnalysisScore, maxInterviewScore)
        : (maxAnalysisScore ?? maxInterviewScore);

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

    const scoreHistory = Array.from(historyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json(
      {
        resumeCount,
        analysisCount,
        interviewCount,
        bestScore,
        recentAnalyses,
        recentSessions,
        scoreHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[stats-endpoint]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
