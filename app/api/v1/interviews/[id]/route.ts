import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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
    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, id),
    });

    if (!session) {
      // Fixture fallback for demo / test IDs
      return NextResponse.json({
        session: {
          ...fixtureSession,
          id,
        },
        answers: fixtureSession.answers,
      });
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
