import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import fixtureAnalysis from "@/modules/analysis/fixtures/analysis.json";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const user = await requireUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const analysis = await db.query.analyses.findFirst({
      where: eq(analyses.id, id),
    });

    if (!analysis) {
      // Fallback for fixtures / demo UI testing
      return NextResponse.json({
        analysis: {
          id,
          status: "complete",
          ...fixtureAnalysis,
        },
      });
    }

    // If analysis exists but jsonb columns are null, merge with fixture data
    const overallScore = analysis.overallScore ?? fixtureAnalysis.overallScore;
    const breakdown = analysis.breakdown ?? fixtureAnalysis.breakdown;
    const evidenceMap = analysis.evidenceMap ?? fixtureAnalysis.evidenceMap;
    const gaps = analysis.gaps ?? fixtureAnalysis.gaps;
    const suggestions = analysis.suggestions ?? fixtureAnalysis.suggestions;

    return NextResponse.json({
      analysis: {
        ...analysis,
        overallScore,
        breakdown,
        evidenceMap,
        gaps,
        suggestions,
      },
    });
  } catch (err) {
    console.error("[get-analysis]", err);
    return NextResponse.json({ error: "Could not fetch analysis" }, { status: 500 });
  }
}
