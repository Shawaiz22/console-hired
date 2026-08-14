import { generateObject } from "ai";
import { and, eq, isNotNull } from "drizzle-orm";
import { extractionModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { jobDescriptions } from "@/lib/db/schema";
import { ParsedJDSchema } from "../schemas/jd.schema";

export async function parseJD(jdId: string) {
  const jd = await db.query.jobDescriptions.findFirst({
    where: eq(jobDescriptions.id, jdId),
  });
  if (!jd || jd.parsed) return;

  // cache: has this exact text been parsed before?
  const cached = await db.query.jobDescriptions.findFirst({
    where: and(eq(jobDescriptions.textHash, jd.textHash), isNotNull(jobDescriptions.parsed)),
  });
  if (cached?.parsed) {
    await db
      .update(jobDescriptions)
      .set({ parsed: cached.parsed })
      .where(eq(jobDescriptions.id, jdId));
    return;
  }

  try {
    const { object } = await generateObject({
      model: extractionModel,
      schema: ParsedJDSchema,
      prompt: `Extract structured information from this job description.

Rules:
- Separate requiredSkills from niceToHaveSkills carefully. "Must have", "required", "strong experience with" go to requiredSkills. "Bonus", "nice to have", "a plus", "preferred" go to niceToHaveSkills.
- responsibilities must be discrete bullet strings, one responsibility per entry. Do not return paragraphs.
- minYears/maxYears: total required experience in years (e.g., "3-5 years" -> minYears: 3, maxYears: 5; "at least 2 years" -> minYears: 2, maxYears: null). Set to null if unstated.
- seniority: classify as intern, junior, mid, senior, lead, or unspecified.
- If title or company are not stated in text, use null for company and best estimate for title.

Job Description:
${jd.rawText}`,
    });

    await db.update(jobDescriptions).set({ parsed: object }).where(eq(jobDescriptions.id, jdId));
  } catch (err) {
    console.error(`[parseJD:error] Failed to parse Job Description ID ${jdId}:`, err);
    throw err;
  }
}
