import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import fixtureSession from "@/modules/interview/fixtures/interview.json";

export const runtime = "nodejs";

const CreateInterviewSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescriptionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { resumeId, jobDescriptionId } = parsed.data;

    const [session] = await db
      .insert(interviewSessions)
      .values({
        userId: user.id,
        resumeId,
        jobDescriptionId,
        status: "in_progress",
        questions: fixtureSession.questions,
      })
      .returning({ id: interviewSessions.id });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[create-interview]", err);
    return NextResponse.json({ error: "Could not create interview session" }, { status: 500 });
  }
}
