import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewAnswers, interviewSessions } from "@/lib/db/schema";
import fixtureSession from "@/modules/interview/fixtures/interview.json";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Ownership: scope in the query so another user's session reads as 404
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.id, id), eq(interviewSessions.userId, user.id)),
    });

    if (!session) {
      if (id.startsWith("demo") || id === "demo" || id === fixtureSession.id) {
        return NextResponse.json({
          session: {
            ...fixtureSession,
            id,
          },
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
