import { generateObject } from "ai";
import { and, eq, isNotNull } from "drizzle-orm";
import { extractionModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { ParsedResumeSchema } from "../schemas/resume.schema";

export async function parseResume(resumeId: string) {
  const resume = await db.query.resumes.findFirst({ where: eq(resumes.id, resumeId) });
  if (!resume || resume.parsed) return;

  // cache: has this exact text been parsed before?
  const cached = await db.query.resumes.findFirst({
    where: and(eq(resumes.textHash, resume.textHash), isNotNull(resumes.parsed)),
  });
  if (cached?.parsed) {
    await db.update(resumes).set({ parsed: cached.parsed }).where(eq(resumes.id, resumeId));
    return;
  }

  const { object } = await generateObject({
    model: extractionModel,
    schema: ParsedResumeSchema,
    prompt: `Extract structured information from this resume.

Rules:
- Copy bullet points VERBATIM. Do not summarise, shorten, or rewrite them.
- If a field is genuinely absent, use null or an empty array. Never invent data.
- yearsOfExperience: total professional experience in years, excluding internships.
- Categorise each skill as language, framework, tool, soft, or domain.

Resume:
${resume.rawText}`,
  });

  await db.update(resumes).set({ parsed: object }).where(eq(resumes.id, resumeId));
}
