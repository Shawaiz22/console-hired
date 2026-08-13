import resumeFixture from "../modules/resume/fixtures/resume.json";
import jdFixture from "../modules/resume/fixtures/jd.json";
import {
  mapEvidence,
  embedItems,
  cosine,
  STRONG_THRESHOLD,
  PARTIAL_THRESHOLD,
} from "../modules/analysis/utils/evidence";

async function main() {
  console.log("=================================================");
  console.log("       F2-3: EVIDENCE MAPPING ENGINE TEST        ");
  console.log("=================================================\n");

  const responsibilities = jdFixture.responsibilities;
  // Extract all bullets from experience
  const resumeBullets = resumeFixture.experience.flatMap((exp) => exp.bullets);

  console.log(`JD Responsibilities count: ${responsibilities.length}`);
  console.log(`Resume Bullets count: ${resumeBullets.length}`);
  console.log(
    `Configured thresholds: Strong >= ${STRONG_THRESHOLD}, Partial >= ${PARTIAL_THRESHOLD}\n`
  );

  console.log("--- 1. Computing Similarity Matrix ---");

  try {
    const respEmbeddings = await embedItems(responsibilities);
    const bulletEmbeddings = await embedItems(resumeBullets);

    // Print full similarity matrix
    console.log("\nFull Matrix (Cosine Similarities):");
    responsibilities.forEach((req, rIdx) => {
      console.log(`\n[Requirement ${rIdx + 1}]: "${req}"`);
      const row = resumeBullets.map((bullet, bIdx) => {
        const sim = cosine(respEmbeddings[rIdx].vector, bulletEmbeddings[bIdx].vector);
        return {
          bulletIndex: bIdx + 1,
          similarity: Math.round(sim * 100) / 100,
          bulletText: bullet.length > 70 ? bullet.substring(0, 67) + "..." : bullet,
        };
      });

      // Sort row by similarity descending
      row.sort((a, b) => b.similarity - a.similarity);
      console.table(row);
    });

    console.log("\n--- 2. Running Evidence Mapping Result ---");
    const result = await mapEvidence(responsibilities, resumeBullets, {
      precomputedResponsibilityVectors: respEmbeddings.map((r) => r.vector),
      precomputedBulletVectors: bulletEmbeddings.map((b) => b.vector),
    });

    console.table(
      result.evidenceMap.map((item, idx) => ({
        "#": idx + 1,
        Requirement:
          item.requirement.length > 40
            ? item.requirement.substring(0, 37) + "..."
            : item.requirement,
        Status: item.status.toUpperCase(),
        Similarity: item.similarity,
        MatchedBullet: item.matchedBullet
          ? item.matchedBullet.length > 50
            ? item.matchedBullet.substring(0, 47) + "..."
            : item.matchedBullet
          : "null",
      }))
    );

    console.log(`\nEvidence Score: ${result.score} / 100`);
    console.log("=================================================");
  } catch (error) {
    console.error("Test execution encountered an error:", error);
  }
}

main();
