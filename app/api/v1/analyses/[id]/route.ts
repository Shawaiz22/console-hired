import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { isUuid } from "@/lib/validation";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 });
  }

  // Ownership: Scope query with both id AND userId.
  // Return 404 (not 403) on mismatch to prevent resource enumeration.
  const analysis = await db.query.analyses.findFirst({
    where: and(eq(analyses.id, id), eq(analyses.userId, user.id)),
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis }, { status: 200 });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 });
  }

  const analysis = await db.query.analyses.findFirst({
    where: and(eq(analyses.id, id), eq(analyses.userId, user.id)),
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const { runAnalysis } = await import("@/modules/analysis/utils/run-analysis");

  await db
    .update(analyses)
    .set({ status: "processing", errorMessage: null })
    .where(eq(analyses.id, id));

  runAnalysis(id).catch(console.error);

  return NextResponse.json({ success: true, message: "Analysis restarted" });
}
