import resumeFixture from "../modules/resume/fixtures/resume.json";
import jdFixture from "../modules/resume/fixtures/jd.json";
import { matchSkills, normalize } from "../modules/analysis/utils/skills";

async function main() {
  console.log("=================================================");
  console.log("        F2-1: SKILL MATCHING ENGINE TEST         ");
  console.log("=================================================\n");

  // 1. Alias & Normalizer Verification
  console.log("--- 1. Verification of Common Aliases ---");
  const testAliases = [
    ["JS", "JavaScript"],
    ["TS", "TypeScript"],
    ["ReactJS", "React"],
    ["React.js", "React"],
    ["Next.js", "NextJS"],
    ["Tailwind CSS", "Tailwind"],
    ["Node.js", "NodeJS"],
    ["k8s", "Kubernetes"],
    ["Postgres", "PostgreSQL"],
    ["PG", "PostgreSQL"],
    ["GCP", "Google Cloud"],
    ["AWS", "Amazon Web Services"],
    ["CI/CD", "Continuous Integration"],
    ["C++", "C++"],
    ["C#", "C#"],
    [".NET", "DotNet"],
    ["REST APIs", "REST"],
  ];

  console.table(
    testAliases.map(([inputA, inputB]) => ({
      InputA: inputA,
      NormalizedA: normalize(inputA),
      InputB: inputB,
      NormalizedB: normalize(inputB),
      Matches: normalize(inputA) === normalize(inputB) ? "✅ YES" : "❌ NO",
    }))
  );

  // 2. Matching against Fixtures
  console.log("\n--- 2. Matching against Resume & JD Fixtures ---");
  const resumeSkills = resumeFixture.skills.map((s) => s.name);
  const requiredSkills = jdFixture.requiredSkills;
  const niceToHaveSkills = jdFixture.niceToHaveSkills;

  console.log(`Resume candidate: ${resumeFixture.name}`);
  console.log(`Resume skills (${resumeSkills.length}):`, resumeSkills.join(", "));
  console.log(`JD Required skills (${requiredSkills.length}):`, requiredSkills.join(", "));
  console.log(`JD Nice-to-have skills (${niceToHaveSkills.length}):`, niceToHaveSkills.join(", "));

  const result = await matchSkills(resumeSkills, requiredSkills, niceToHaveSkills);

  console.log("\n--- Matched Skills ---");
  console.table(
    result.matched.map((m) => ({
      Skill: m.skill,
      MatchedWith: m.matchedWith,
      Type: m.required ? "Required (2x)" : "Nice-to-have (1x)",
      Pass: `Pass ${m.pass}`,
      Similarity: m.similarity !== undefined ? m.similarity : "N/A",
    }))
  );

  console.log("\n--- Missing Skills ---");
  console.table(
    result.missing.map((m) => ({
      Skill: m.skill,
      Type: m.required ? "Required (2x)" : "Nice-to-have (1x)",
    }))
  );

  console.log(`\nFinal Match Score: ${result.score} / 100\n`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
