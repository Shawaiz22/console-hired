import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { extractionModel } from "@/lib/ai";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewSessions, jobDescriptions, resumes } from "@/lib/db/schema";
import fixtureSession from "@/modules/interview/fixtures/interview.json";
import { InterviewQuestionSchema } from "@/modules/interview/schemas/interview.schema";

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

    // Strict ownership check for both resume and job description
    const resume = await db.query.resumes.findFirst({
      where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
    });

    const jd = await db.query.jobDescriptions.findFirst({
      where: and(eq(jobDescriptions.id, jobDescriptionId), eq(jobDescriptions.userId, user.id)),
    });

    if (!resume || !jd) {
      return NextResponse.json({ error: "Resume or Job Description not found" }, { status: 404 });
    }

    let questions = fixtureSession.questions;

    try {
      const { object } = await generateObject({
        model: extractionModel,
        schema: z.object({ questions: z.array(InterviewQuestionSchema).length(6) }),
        prompt: `Generate 6 interview questions for this candidate and role — 4 technical, 2 behavioral.
Ground every question in something specific from the resume or job description.
Reference actual technologies and responsibilities, not generic topics.
Fill whyAsked with a one-line reason a real interviewer would ask it.

Resume: ${JSON.stringify(resume.parsed || resume.rawText)}
Job Description: ${JSON.stringify(jd.parsed || jd.rawText)}`,
      });

      if (object.questions && object.questions.length === 6) {
        questions = object.questions;
      }
    } catch (aiErr) {
      console.warn("[interview-ai-generation-fallback]", aiErr);
    }

    const [session] = await db
      .insert(interviewSessions)
      .values({
        userId: user.id,
        resumeId,
        jobDescriptionId,
        status: "in_progress",
        questions,
      })
      .returning({ id: interviewSessions.id, questions: interviewSessions.questions });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[create-interview]", err);
    return NextResponse.json({ error: "Could not create interview session" }, { status: 500 });
  }
}
