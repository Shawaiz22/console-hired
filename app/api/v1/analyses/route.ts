import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";

export const runtime = "nodejs";

const CreateAnalysisSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescriptionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateAnalysisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { resumeId, jobDescriptionId } = parsed.data;

    const [analysis] = await db
      .insert(analyses)
      .values({
        userId: user.id,
        resumeId,
        jobDescriptionId,
        status: "pending",
      })
      .returning({ id: analyses.id });

    return NextResponse.json({ analysis }, { status: 201 });
  } catch (err) {
    console.error("[create-analysis]", err);
    return NextResponse.json({ error: "Could not create analysis" }, { status: 500 });
  }
}
