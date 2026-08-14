import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const summary = {
    overallImpression:
      "Demonstrated strong technical knowledge and solid problem-solving structure across all questions.",
    topStrengths: [
      "Excellent modular design principles in React/TypeScript",
      "Clear STAR framework structure in behavioral responses",
      "Proactive performance profiling and metrics tracking",
    ],
    focusAreas: [
      "Quantify impact with more explicit business metrics in technical answers",
      "Mention CI/CD deployment automation strategies upfront",
    ],
  };

  const overallScore = 84;

  try {
    // Ownership: scope the update so one user cannot complete another's session
    const updated = await db
      .update(interviewSessions)
      .set({
        status: "completed",
        overallScore,
        summary,
        updatedAt: new Date(),
      })
      .where(and(eq(interviewSessions.id, id), eq(interviewSessions.userId, user.id)))
      .returning({ id: interviewSessions.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }
  } catch (err) {
    console.error("[complete-interview] DB update error:", err);
    return NextResponse.json({ error: "Could not complete interview session" }, { status: 500 });
  }

  return NextResponse.json({
    session: {
      id,
      status: "completed",
      overallScore,
      summary,
    },
  });
}
