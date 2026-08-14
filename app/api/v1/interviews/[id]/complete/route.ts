import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { extractionModel } from "@/lib/ai";
import { requireApiUser } from "@/lib/auth-helpers";
import { isUuid } from "@/lib/validation";
import { db } from "@/lib/db";
import { interviewAnswers, interviewSessions } from "@/lib/db/schema";
import {
  SessionSummarySchema,
  type AnswerEvaluation,
  type SessionSummary,
} from "@/modules/interview/schemas/interview.schema";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    // Ownership check
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.id, id), eq(interviewSessions.userId, user.id)),
    });

    if (!session) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    const answers = await db.query.interviewAnswers.findMany({
      where: eq(interviewAnswers.sessionId, id),
    });

    // Score comes from the stored per-answer evaluations, so an unanswered
    // session has nothing to score rather than a default to fall back on.
    let totalDimSum = 0;
    let totalDims = 0;

    for (const ans of answers) {
      const ev = ans.evaluation as AnswerEvaluation | null;
      if (ev) {
        totalDimSum += ev.clarity + ev.relevance + ev.completeness + ev.specificity;
        totalDims += 4;
      }
    }

    if (totalDims === 0) {
      return NextResponse.json(
        { error: "Answer at least one question before completing this session" },
        { status: 400 }
      );
    }

    const overallScore = Math.round((totalDimSum / (totalDims * 5)) * 100);

    // The summary is AI-generated or absent — it is never invented locally, so a
    // failed call completes the session with a real score and a null summary.
    let summary: SessionSummary | null = null;

    try {
      const { object: aiSummary } = await generateObject({
        model: extractionModel,
        schema: SessionSummarySchema,
        prompt: `Synthesize an interview session summary based on the candidate's answers and evaluations.
Provide an overallImpression, 3 topStrengths, and 2-3 focusAreas for improvement.

Questions & Answers: ${JSON.stringify(answers)}`,
      });

      summary = aiSummary;
    } catch (aiErr) {
      console.warn("[interview-summary-ai-generation-failed]", aiErr);
    }

    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        overallScore,
        summary,
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, id));

    return NextResponse.json({
      session: {
        id,
        status: "completed",
        overallScore,
        summary,
      },
    });
  } catch (err) {
    console.error("[complete-interview-session]", err);
    return NextResponse.json({ error: "Could not complete session" }, { status: 500 });
  }
}
