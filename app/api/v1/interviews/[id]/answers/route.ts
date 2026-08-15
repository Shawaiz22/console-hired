import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { evaluationModel } from "@/lib/ai";
import { requireApiUser } from "@/lib/auth-helpers";
import { isUuid } from "@/lib/validation";
import { db } from "@/lib/db";
import { interviewAnswers, interviewSessions } from "@/lib/db/schema";
import {
  AnswerEvaluationSchema,
  AnswerInputSchema,
  type InterviewQuestion,
} from "@/modules/interview/schemas/interview.schema";
import { rubricPrompt } from "@/modules/interview/utils/prompts";
import { analyzeDelivery } from "@/modules/interview/utils/analyze-delivery";
import { computeMetrics } from "@/modules/interview/utils/delivery-metrics";
import type { DeliveryMetrics } from "@/modules/interview/schemas/interview.schema";

export const runtime = "nodejs";
// Audio analysis adds a second, slower model call on top of content grading
export const maxDuration = 60;

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;

  if (!isUuid(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  // Ownership: never write an answer into a session the caller does not own
  const session = await db.query.interviewSessions.findFirst({
    where: and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, user.id)),
  });

  if (!session) {
    return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = AnswerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { questionIndex, answerText, inputMode, audio } = parsed.data;

  const targetQuestion = (session.questions as InterviewQuestion[] | null)?.[questionIndex];
  if (!targetQuestion) {
    return NextResponse.json(
      { error: "That question does not exist in this session" },
      { status: 400 }
    );
  }

  // Feedback is always model-generated: if grading fails the caller is told,
  // rather than being handed a canned evaluation.
  let evaluation;
  try {
    const { object: aiEval } = await generateObject({
      model: evaluationModel,
      schema: AnswerEvaluationSchema,
      prompt: rubricPrompt(targetQuestion, answerText),
    });
    evaluation = aiEval;
  } catch (aiErr) {
    console.error("[interview-answer-ai-grading-failed]", aiErr);
    return NextResponse.json(
      { error: "Could not evaluate your answer right now. Please try again." },
      { status: 503 }
    );
  }

  // Delivery analysis is supplementary and must never fail the submission: the answer
  // still saves and the content feedback still renders without it. The deterministic
  // metrics survive even when the model call does not, so `analysis: null` means the
  // section is omitted and said to be omitted — not invented.
  let deliveryMetrics: DeliveryMetrics | null = null;
  if (audio) {
    const metrics = computeMetrics(answerText, audio.durationMs);
    let analysis = null;
    try {
      analysis = await analyzeDelivery(audio.base64, targetQuestion.question);
    } catch (audioErr) {
      console.error("[delivery-analysis]", audioErr); // swallowed deliberately
    }
    deliveryMetrics = { ...metrics, analysis };
  }

  try {
    await db.insert(interviewAnswers).values({
      sessionId,
      questionIndex,
      answerText,
      inputMode: inputMode || "text",
      evaluation,
      deliveryMetrics,
    });
  } catch (dbErr) {
    console.error("[post-answer] DB insert error:", dbErr);
    return NextResponse.json({ error: "Could not save your answer" }, { status: 500 });
  }

  return NextResponse.json({
    answer: {
      questionIndex,
      answerText,
      inputMode: inputMode || "text",
      evaluation,
      deliveryMetrics,
    },
  });
}
