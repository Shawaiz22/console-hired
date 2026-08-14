import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { extractionModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { analyses, jobDescriptions, resumes } from "@/lib/db/schema";
import { Gap, GapSchema, Suggestion, SuggestionSchema } from "../schemas/analysis.schema";
import { ParsedJDSchema } from "@/modules/resume/schemas/jd.schema";
import { ParsedResumeSchema } from "@/modules/resume/schemas/resume.schema";
import { matchSkills } from "./skills";
import { evaluateExperienceFit } from "./experience";
import { mapEvidence } from "./evidence";

const SuggestionsAndGapsSchema = z.object({
  gaps: z.array(GapSchema),
  suggestions: z.array(SuggestionSchema),
});

/**
 * Executes the complete 4-part scoring engine pipeline and AI suggestions.
 *
 * Pipeline:
 * 1. Mark status: 'processing'
 * 2. Load and verify parsed Resume + parsed JD (with polling if still parsing)
 * 3. Deterministic scoring:
 *    - matchSkills() (40% weight)
 *    - evaluateExperienceFit() (20% weight)
 *    - mapEvidence() (30% weight)
 *    - ATS hygiene (10% weight - hardcoded 100 until ATS checker module)
 * 4. Generative AI call: Structured gap explanations and bullet rewrites
 * 5. Compute overallScore and save status: 'complete' with completedAt
 * 6. Handle errors by marking status: 'failed' + errorMessage
 */
export async function runAnalysis(analysisId: string): Promise<void> {
  try {
    // 1. Update status to 'processing'
    await db
      .update(analyses)
      .set({ status: "processing", errorMessage: null })
      .where(eq(analyses.id, analysisId));

    // 2. Fetch analysis record
    const analysis = await db.query.analyses.findFirst({
      where: eq(analyses.id, analysisId),
    });

    if (!analysis) {
      throw new Error(`Analysis record with id ${analysisId} not found`);
    }

    // Load Resume and Job Description (poll briefly if parsing is still in progress)
    let resume = await db.query.resumes.findFirst({
      where: eq(resumes.id, analysis.resumeId),
    });
    let jd = await db.query.jobDescriptions.findFirst({
      where: eq(jobDescriptions.id, analysis.jobDescriptionId),
    });

    let attempts = 0;
    while ((!resume?.parsed || !jd?.parsed) && attempts < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
      resume = await db.query.resumes.findFirst({
        where: eq(resumes.id, analysis.resumeId),
      });
      jd = await db.query.jobDescriptions.findFirst({
        where: eq(jobDescriptions.id, analysis.jobDescriptionId),
      });
    }

    if (!resume) throw new Error("Resume not found");
    if (!jd) throw new Error("Job description not found");

    if (!resume.parsed || !jd.parsed) {
      const missingParts: string[] = [];
      if (!resume.parsed) missingParts.push("Resume");
      if (!jd.parsed) missingParts.push("Job description");
      throw new Error(
        `${missingParts.join(" and ")} document parsing has not completed yet. Please wait a moment and retry.`
      );
    }

    const parsedResume = ParsedResumeSchema.parse(resume.parsed);
    const parsedJd = ParsedJDSchema.parse(jd.parsed);

    // 3. Deterministic Scoring Pipeline
    // 3.1 Skill Matcher (40% weight)
    const resumeSkillNames = parsedResume.skills.map((s) => s.name);
    const skillResult = await matchSkills(
      resumeSkillNames,
      parsedJd.requiredSkills,
      parsedJd.niceToHaveSkills
    );

    // 3.2 Experience & Seniority Fit (20% weight)
    const expResult = evaluateExperienceFit(parsedResume.experience, {
      minYears: parsedJd.minYears,
      maxYears: parsedJd.maxYears,
      seniority: parsedJd.seniority,
    });

    // 3.3 Responsibility Evidence Mapping (30% weight)
    const resumeBullets = parsedResume.experience.flatMap((exp) => exp.bullets);

    // Check cached vector embeddings on document rows
    const cachedRespVectors = Array.isArray(jd.embeddings)
      ? (jd.embeddings as Array<{ vector: number[] }>).map((e) => e.vector)
      : undefined;
    const cachedBulletVectors = Array.isArray(resume.embeddings)
      ? (resume.embeddings as Array<{ vector: number[] }>).map((e) => e.vector)
      : undefined;

    const evidenceResult = await mapEvidence(parsedJd.responsibilities, resumeBullets, {
      precomputedResponsibilityVectors: cachedRespVectors,
      precomputedBulletVectors: cachedBulletVectors,
    });

    // Cache vector embeddings if newly computed
    if (!resume.embeddings && evidenceResult.rawEmbeddings?.bullets) {
      await db
        .update(resumes)
        .set({ embeddings: evidenceResult.rawEmbeddings.bullets })
        .where(eq(resumes.id, resume.id));
    }
    if (!jd.embeddings && evidenceResult.rawEmbeddings?.responsibilities) {
      await db
        .update(jobDescriptions)
        .set({ embeddings: evidenceResult.rawEmbeddings.responsibilities })
        .where(eq(jobDescriptions.id, jd.id));
    }

    // 3.4 ATS Hygiene (10% weight - hardcoded 100 until ATS checker)
    const atsHygiene = 100;

    // 4. LLM Generation for Gap Explanations and Bullet Suggestions
    let gaps: Gap[] = [];
    let suggestions: Suggestion[] = [];

    try {
      const prompt = `You are an elite technical recruiter and hiring bar-raiser reviewing a candidate's resume against a job description.

Job Title: ${parsedJd.title}
Job Company: ${parsedJd.company ?? "Confidential"}
Seniority Target: ${parsedJd.seniority}
JD Required Skills: ${parsedJd.requiredSkills.join(", ")}
JD Nice-to-Have Skills: ${parsedJd.niceToHaveSkills.join(", ")}
JD Responsibilities:
${parsedJd.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Candidate Skills: ${resumeSkillNames.join(", ")}
Candidate Experience Bullets:
${resumeBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Missing Skills Identified:
${skillResult.missing.map((m) => `- ${m.skill} (${m.required ? "Required" : "Nice-to-have"})`).join("\n")}

Generate:
1. "gaps": For each missing skill, explain why it is important for this position and how the lack of experience impacts candidate fit.
2. "suggestions": 2-4 concrete, high-impact bullet improvements. Either rewrite existing candidate bullets (setting "original" to the exact candidate bullet string) with strong action verbs and quantified impact, or suggest brand-new bullet additions (setting "original" to null). Include a concise "rationale" for each.`;

      const aiResponse = await generateObject({
        model: extractionModel,
        schema: SuggestionsAndGapsSchema,
        prompt,
      });

      gaps = aiResponse.object.gaps;
      suggestions = aiResponse.object.suggestions;
    } catch (llmError) {
      console.warn("[runAnalysis] LLM suggestion generation fallback:", llmError);
      // Deterministic fallback if LLM is unreachable
      gaps = skillResult.missing.map((m) => ({
        skill: m.skill,
        required: m.required,
        reason: `${m.skill} is listed as ${
          m.required ? "a required" : "a nice-to-have"
        } skill in the job description but was not detected in the resume profile.`,
      }));
      suggestions = [];
    }

    // 5. Compute Weighted Overall Score
    const breakdown = {
      skillCoverage: skillResult.score,
      experienceFit: expResult.score,
      responsibilityEvidence: evidenceResult.score,
      atsHygiene,
    };

    const overallScore = Math.round(
      breakdown.skillCoverage * 0.4 +
        breakdown.experienceFit * 0.2 +
        breakdown.responsibilityEvidence * 0.3 +
        breakdown.atsHygiene * 0.1
    );

    // 6. Write complete result to database
    await db
      .update(analyses)
      .set({
        status: "complete",
        overallScore,
        breakdown,
        evidenceMap: evidenceResult.evidenceMap,
        gaps,
        suggestions,
        errorMessage: null,
        completedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    console.error(`[runAnalysis] Analysis ${analysisId} failed:`, error);
    const errorMessage = error instanceof Error ? error.message : "Analysis processing failed";

    await db
      .update(analyses)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(analyses.id, analysisId))
      .catch((dbErr) => {
        console.error("[runAnalysis] Failed to write error status:", dbErr);
      });
  }
}
