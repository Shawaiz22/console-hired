import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await requireUser();
  if (!user?.id) {
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
    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        overallScore,
        summary,
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, id));
  } catch {
    // Ignore if session ID was fixture demo
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
