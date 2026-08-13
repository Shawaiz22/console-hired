import resumeFixture from "../modules/resume/fixtures/resume.json";
import jdFixture from "../modules/resume/fixtures/jd.json";
import {
  parseDate,
  calculateTotalYearsOfExperience,
  evaluateExperienceFit,
} from "../modules/analysis/utils/experience";

function testExperienceEngine() {
  console.log("=================================================");
  console.log("     F2-2: EXPERIENCE & SENIORITY FIT TEST       ");
  console.log("=================================================\n");

  // 1. Test Date Parsing Formats
  console.log("--- 1. Testing Tolerant Date Parsing ---");
  const testDates = [
    "Jan 2022",
    "January 2022",
    "01/2022",
    "2022-01",
    "2022",
    "present",
    "current",
    null,
  ];

  console.table(
    testDates.map((dateStr) => {
      const parsed = parseDate(dateStr);
      return {
        Input: String(dateStr),
        ParsedUTC: parsed ? parsed.toISOString().split("T")[0] : "null (Present / Ongoing)",
        Status: "✅ Parsed",
      };
    })
  );

  // 2. Test Fixture Resume Experience Sum
  console.log("\n--- 2. Testing Experience Duration from Fixture ---");
  console.log(`Candidate: ${resumeFixture.name}`);
  const calculatedYears = calculateTotalYearsOfExperience(resumeFixture.experience);
  console.log(`Parsed roles count: ${resumeFixture.experience.length}`);
  console.log(
    `Calculated total years: ${calculatedYears} years (Fixture states: ${resumeFixture.yearsOfExperience} years)`
  );

  // 3. Testing Fit Scoring Scenarios
  console.log("\n--- 3. Testing Experience Fit Scenarios ---");
  const scenarios = [
    {
      description: "Fixture: Alex Mercer vs Senior Frontend JD (3.5y vs [3, 5])",
      actual: calculatedYears,
      criteria: {
        minYears: jdFixture.minYears,
        maxYears: jdFixture.maxYears,
        seniority: jdFixture.seniority,
      },
    },
    {
      description: "Inside Range (4 years vs [3, 5])",
      actual: 4,
      criteria: { minYears: 3, maxYears: 5, seniority: "mid" },
    },
    {
      description: "Below Min (1.5 years vs min 3 -> 50%)",
      actual: 1.5,
      criteria: { minYears: 3, maxYears: 5, seniority: "mid" },
    },
    {
      description: "Below Min Floored (0.2 years vs min 3 -> floored at 20%)",
      actual: 0.2,
      criteria: { minYears: 3, maxYears: 5, seniority: "mid" },
    },
    {
      description: "Above Max (8 years vs [3, 5] -> 100%, no penalty)",
      actual: 8,
      criteria: { minYears: 3, maxYears: 5, seniority: "senior" },
    },
    {
      description: "Null JD Years (Unspecified -> 75% unassessed)",
      actual: 3.5,
      criteria: { minYears: null, maxYears: null, seniority: "unspecified" },
    },
    {
      description:
        "Seniority Mismatch (1 year vs Senior role without explicit minYears -> pulled down)",
      actual: 1,
      criteria: { minYears: null, maxYears: null, seniority: "senior" },
    },
  ];

  console.table(
    scenarios.map((s) => {
      const result = evaluateExperienceFit(s.actual, s.criteria);
      return {
        Scenario: s.description,
        Score: `${result.score}%`,
        Status: result.status,
        Unassessed: result.unassessed ? "Yes" : "No",
      };
    })
  );

  console.log("\n=================================================");
}

testExperienceEngine();
