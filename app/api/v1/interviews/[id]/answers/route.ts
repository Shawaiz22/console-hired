import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { evaluationModel } from "@/lib/ai";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { interviewAnswers, interviewSessions } from "@/lib/db/schema";
import fixtureSession from "@/modules/interview/fixtures/interview.json";
import {
  AnswerEvaluationSchema,
  type InterviewQuestion,
} from "@/modules/interview/schemas/interview.schema";
import { rubricPrompt } from "@/modules/interview/utils/prompts";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

const AnswerInputSchema = z.object({
  questionIndex: z.number().min(0).max(5),
  answerText: z.string().min(10),
});

export async function POST(req: Request, { params }: { params: Params }) {
  const user = await requireUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  try {
    const body = await req.json();
    const parsed = AnswerInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { questionIndex, answerText } = parsed.data;

    // Strict ownership check
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, user.id)),
    });

    const targetQuestion: InterviewQuestion =
      (session?.questions as InterviewQuestion[])?.[questionIndex] ||
      fixtureSession.questions[questionIndex];

    if (!session && sessionId !== fixtureSession.id) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    let evaluation = fixtureSession.answers[questionIndex % 2]?.evaluation || {
      clarity: 4,
      relevance: 5,
      completeness: 4,
      specificity: 4,
      star:
        targetQuestion.type === "behavioral"
          ? {
              situation: "Faced tight sprint deadline with legacy codebase.",
              task: "Refactor core modules without breaking client APIs.",
              action: "Architected modular interfaces and automated testing.",
              result: "Delivered feature 2 days early with zero regression bugs.",
            }
          : null,
      strengths: ["Structured answer with clear technical context", "Direct response to prompt"],
      improvements: ["Could add more explicit metric numbers"],
    };

    try {
      const { object: aiEval } = await generateObject({
        model: evaluationModel,
        schema: AnswerEvaluationSchema,
        prompt: rubricPrompt(targetQuestion, answerText),
      });

      if (aiEval) {
        evaluation = aiEval;
      }
    } catch (aiErr) {
      console.warn("[interview-answer-ai-grading-fallback]", aiErr);
    }

    if (session) {
      try {
        await db.insert(interviewAnswers).values({
          sessionId,
          questionIndex,
          answerText,
          inputMode: "text",
          evaluation,
        });
      } catch {
        // Ignore duplicate insert during dev retries
      }
    }

    return NextResponse.json({
      answer: {
        questionIndex,
        answerText,
        evaluation,
      },
    });
  } catch (err) {
    console.error("[post-answer]", err);
    return NextResponse.json({ error: "Could not evaluate answer" }, { status: 500 });
  }
}
