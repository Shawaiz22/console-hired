import { analyzeATSCompatibilityFromItems, PDFTextItem } from "../modules/analysis/utils/ats";

function main() {
  console.log("=================================================");
  console.log("       F2-B: ATS COMPATIBILITY CHECKER TEST      ");
  console.log("=================================================\n");

  // 1. Scenario: Clean Single-Column Resume
  console.log("--- 1. Testing Clean Single-Column Resume ---");
  const cleanItems: PDFTextItem[] = [
    { str: "Alex Mercer", transform: [1, 0, 0, 1, 50, 750], width: 100, height: 14, page: 1 },
    {
      str: "alex.mercer@example.com | 555-0199",
      transform: [1, 0, 0, 1, 50, 730],
      width: 200,
      height: 10,
      page: 1,
    },
    { str: "Experience", transform: [1, 0, 0, 1, 50, 700], width: 80, height: 12, page: 1 },
    {
      str: "Senior Frontend Engineer - TechCorp Innovations (2022 - Present)",
      transform: [1, 0, 0, 1, 50, 680],
      width: 400,
      height: 10,
      page: 1,
    },
    {
      str: "Built a design-system component library used across 4 core web products using React, TypeScript, and Tailwind CSS",
      transform: [1, 0, 0, 1, 50, 660],
      width: 500,
      height: 10,
      page: 1,
    },
    {
      str: "Optimized client-side rendering pipeline, improving Lighthouse performance score from 64 to 92",
      transform: [1, 0, 0, 1, 50, 640],
      width: 500,
      height: 10,
      page: 1,
    },
    { str: "Education", transform: [1, 0, 0, 1, 50, 600], width: 70, height: 12, page: 1 },
    {
      str: "B.S. in Computer Science - State University of Technology (2020)",
      transform: [1, 0, 0, 1, 50, 580],
      width: 400,
      height: 10,
      page: 1,
    },
    { str: "Technical Skills", transform: [1, 0, 0, 1, 50, 540], width: 100, height: 12, page: 1 },
    {
      str: "React, TypeScript, Next.js, Tailwind CSS, Jest, GraphQL, Node.js",
      transform: [1, 0, 0, 1, 50, 520],
      width: 450,
      height: 10,
      page: 1,
    },
  ];

  const cleanReport = analyzeATSCompatibilityFromItems(cleanItems, 1);
  console.log(`ATS Hygiene Score: ${cleanReport.score} / 100`);
  console.table(
    cleanReport.findings.map((f) => ({
      Category: f.category,
      Passed: f.passed ? "✅ YES" : "❌ NO",
      Severity: f.severity,
      Title: f.title,
    }))
  );

  // 2. Scenario: Multi-Column Resume with Non-Standard Headings and Contact in Header Margin
  console.log("\n--- 2. Testing Two-Column Resume with Issues ---");
  const problematicItems: PDFTextItem[] = [
    // Contact in Top 8% Margin (y > 780)
    {
      str: "contact@alexmercer.dev | (555) 234-5678",
      transform: [1, 0, 0, 1, 50, 800],
      width: 250,
      height: 10,
      page: 1,
    },
    // Left Column (X ~ 50)
    { str: "My Story", transform: [1, 0, 0, 1, 50, 720], width: 60, height: 12, page: 1 },
    {
      str: "Passionate engineer building tools",
      transform: [1, 0, 0, 1, 50, 700],
      width: 180,
      height: 10,
      page: 1,
    },
    { str: "Stuff I Know", transform: [1, 0, 0, 1, 50, 660], width: 80, height: 12, page: 1 },
    {
      str: "React, TypeScript, Redux, Jest",
      transform: [1, 0, 0, 1, 50, 640],
      width: 180,
      height: 10,
      page: 1,
    },
    // Right Column (X ~ 300)
    { str: "My Journey", transform: [1, 0, 0, 1, 300, 720], width: 80, height: 12, page: 1 },
    {
      str: "Senior Frontend Engineer at TechCorp",
      transform: [1, 0, 0, 1, 300, 700],
      width: 220,
      height: 10,
      page: 1,
    },
    {
      str: "Lead architectural migration from Webpack to Vite",
      transform: [1, 0, 0, 1, 300, 680],
      width: 240,
      height: 10,
      page: 1,
    },
    // Add extra items to trigger dense cluster detection
    ...Array.from({ length: 20 }, (_, i) => ({
      str: `Left column skill entry item ${i + 1}`,
      transform: [1, 0, 0, 1, 60, 600 - i * 15],
      width: 150,
      height: 9,
      page: 1,
    })),
    ...Array.from({ length: 20 }, (_, i) => ({
      str: `Right column achievement detail ${i + 1}`,
      transform: [1, 0, 0, 1, 320, 600 - i * 15],
      width: 200,
      height: 9,
      page: 1,
    })),
  ];

  const problemReport = analyzeATSCompatibilityFromItems(problematicItems, 1);
  console.log(`ATS Hygiene Score: ${problemReport.score} / 100`);
  console.table(
    problemReport.findings.map((f) => ({
      Category: f.category,
      Passed: f.passed ? "✅ YES" : "❌ NO",
      Severity: f.severity,
      Title: f.title,
    }))
  );

  console.log("\n--- Simulated ATS Linear Text (What ATS actually reads) ---");
  console.log(`"${problemReport.linearText.substring(0, 200)}..."\n`);
  console.log("=================================================");
}

main();
