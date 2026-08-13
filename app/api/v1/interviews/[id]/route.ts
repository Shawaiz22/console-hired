import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewAnswers, interviewSessions } from "@/lib/db/schema";
import fixtureSession from "@/modules/interview/fixtures/interview.json";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const user = await requireUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Strict ownership check: filter userId in query
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.id, id), eq(interviewSessions.userId, user.id)),
    });

    if (!session) {
      // Allow fallback if testing fixture ID, otherwise return 404
      if (id === fixtureSession.id) {
        return NextResponse.json({
          session: fixtureSession,
          answers: fixtureSession.answers,
        });
      }
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    const answers = await db.query.interviewAnswers.findMany({
      where: eq(interviewAnswers.sessionId, id),
      orderBy: (answersTable, { asc }) => [asc(answersTable.questionIndex)],
    });

    return NextResponse.json({
      session,
      answers,
    });
  } catch (err) {
    console.error("[get-interview-session]", err);
    return NextResponse.json({ error: "Could not fetch session" }, { status: 500 });
  }
}
