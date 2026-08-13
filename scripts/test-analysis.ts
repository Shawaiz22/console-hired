import resumeFixture from "../modules/resume/fixtures/resume.json";
import jdFixture from "../modules/resume/fixtures/jd.json";
import { matchSkills } from "../modules/analysis/utils/skills";
import { evaluateExperienceFit } from "../modules/analysis/utils/experience";
import { mapEvidence } from "../modules/analysis/utils/evidence";
import { generateObject } from "ai";
import { extractionModel } from "../lib/ai";
import { z } from "zod";
import { GapSchema, SuggestionSchema } from "../modules/analysis/schemas/analysis.schema";

const SuggestionsAndGapsSchema = z.object({
  gaps: z.array(GapSchema),
  suggestions: z.array(SuggestionSchema),
});

async function main() {
  console.log("=================================================");
  console.log("       F2-4: ANALYSIS ORCHESTRATION TEST         ");
  console.log("=================================================\n");

  console.log("Candidate:", resumeFixture.name);
  console.log("Target Position:", jdFixture.title, "at", jdFixture.company);

  // 1. Skill Coverage (40%)
  console.log("\n[1/4] Running Skill Coverage Matcher (40% Weight)...");
  const resumeSkills = resumeFixture.skills.map((s) => s.name);
  const skillResult = await matchSkills(
    resumeSkills,
    jdFixture.requiredSkills,
    jdFixture.niceToHaveSkills
  );
  console.log(
    `-> Skill Score: ${skillResult.score}% (Matched: ${skillResult.matched.length}, Missing: ${skillResult.missing.length})`
  );

  // 2. Experience Fit (20%)
  console.log("\n[2/4] Running Experience Fit Evaluator (20% Weight)...");
  const expResult = evaluateExperienceFit(resumeFixture.experience, {
    minYears: jdFixture.minYears,
    maxYears: jdFixture.maxYears,
    seniority: jdFixture.seniority,
  });
  console.log(
    `-> Experience Score: ${expResult.score}% (${expResult.actualYears} years vs ${jdFixture.minYears}-${jdFixture.maxYears} required)`
  );

  // 3. Evidence Mapping (30%)
  console.log("\n[3/4] Running Responsibility Evidence Mapping (30% Weight)...");
  const resumeBullets = resumeFixture.experience.flatMap((e) => e.bullets);
  const evidenceResult = await mapEvidence(jdFixture.responsibilities, resumeBullets);
  console.log(`-> Evidence Score: ${evidenceResult.score}%`);

  // 4. ATS Hygiene (10%)
  const atsScore = 100;
  console.log(`\n[4/4] ATS Hygiene Score (10% Weight): ${atsScore}%`);

  // 5. LLM Suggestions & Gap Explanations
  console.log("\n--- LLM Gap Analysis & Suggestions ---");
  try {
    const prompt = `You are an elite technical recruiter reviewing a candidate against a job description.

Job Title: ${jdFixture.title}
Job Company: ${jdFixture.company}
Required Skills: ${jdFixture.requiredSkills.join(", ")}
Responsibilities:
${jdFixture.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Candidate Skills: ${resumeSkills.join(", ")}
Candidate Bullets:
${resumeBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Missing Skills:
${skillResult.missing.map((m) => `- ${m.skill} (${m.required ? "Required" : "Nice-to-have"})`).join("\n")}

Generate:
1. "gaps": For each missing skill, explain why it's missing and its impact.
2. "suggestions": 2-3 high-impact bullet improvements or additions.`;

    const aiRes = await generateObject({
      model: extractionModel,
      schema: SuggestionsAndGapsSchema,
      prompt,
    });

    console.log(`\nIdentified Gaps (${aiRes.object.gaps.length}):`);
    console.table(aiRes.object.gaps);

    console.log(`\nBullet Improvement Suggestions (${aiRes.object.suggestions.length}):`);
    console.table(
      aiRes.object.suggestions.map((s) => ({
        Original: s.original
          ? s.original.length > 35
            ? s.original.substring(0, 32) + "..."
            : s.original
          : "(New Bullet)",
        Improved: s.improved.length > 45 ? s.improved.substring(0, 42) + "..." : s.improved,
        Rationale: s.rationale.length > 35 ? s.rationale.substring(0, 32) + "..." : s.rationale,
      }))
    );
  } catch (error) {
    console.log("LLM step skipped/offline:", (error as Error).message);
  }

  // 6. Overall Weighted Score
  const breakdown = {
    skillCoverage: skillResult.score,
    experienceFit: expResult.score,
    responsibilityEvidence: evidenceResult.score,
    atsHygiene: atsScore,
  };

  const overallScore = Math.round(
    breakdown.skillCoverage * 0.4 +
      breakdown.experienceFit * 0.2 +
      breakdown.responsibilityEvidence * 0.3 +
      breakdown.atsHygiene * 0.1
  );

  console.log("\n=================================================");
  console.log("               FINAL ANALYSIS RESULT             ");
  console.log("=================================================");
  console.table(breakdown);
  console.log(`\nOVERALL WEIGHTED SCORE: ${overallScore} / 100\n`);
}

main().catch(console.error);
