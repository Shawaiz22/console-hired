import { NextResponse } from "next/server";
import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses, jobDescriptions, resumes } from "@/lib/db/schema";
import { runAnalysis } from "@/modules/analysis/utils/run-analysis";

export const runtime = "nodejs";

const MAX_ANALYSES_PER_USER = 5;

const CreateAnalysisSchema = z.object({
  resumeId: z.string().uuid("Invalid resumeId format"),
  jobDescriptionId: z.string().uuid("Invalid jobDescriptionId format"),
});

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo usage limit per user
  const [usage] = await db
    .select({ total: count() })
    .from(analyses)
    .where(eq(analyses.userId, user.id));

  if (usage && usage.total >= MAX_ANALYSES_PER_USER) {
    return NextResponse.json(
      {
        error: `Demo limit reached (${MAX_ANALYSES_PER_USER}/${MAX_ANALYSES_PER_USER} analyses used). You have reached the free showcase limit for this account.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = CreateAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { resumeId, jobDescriptionId } = parsed.data;

  // Ownership: scope in the query, never check after fetch
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const jd = await db.query.jobDescriptions.findFirst({
    where: and(eq(jobDescriptions.id, jobDescriptionId), eq(jobDescriptions.userId, user.id)),
  });
  if (!jd) {
    return NextResponse.json({ error: "Job description not found" }, { status: 404 });
  }

  const [analysis] = await db
    .insert(analyses)
    .values({
      userId: user.id,
      resumeId,
      jobDescriptionId,
      status: "pending",
    })
    .returning({ id: analyses.id });

  // Fire-and-forget background processing
  runAnalysis(analysis.id).catch(console.error);

  return NextResponse.json({ id: analysis.id }, { status: 202 });
}
