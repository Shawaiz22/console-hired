import { getDocumentProxy } from "unpdf";

export interface ATSFinding {
  id: string;
  category: "layout" | "contact" | "headings" | "density";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
  passed: boolean;
}

export interface ATSReport {
  score: number; // 0 - 100
  linearText: string;
  findings: ATSFinding[];
  metrics: {
    columnCount: number;
    pageCount: number;
    characterCount: number;
    detectedHeadings: string[];
    nonStandardHeadings: string[];
    contactInMargins: boolean;
  };
}

export interface PDFTextItem {
  str: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, x, y]
  width: number;
  height: number;
  page: number;
}

const STANDARD_HEADINGS = [
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "education",
  "academic history",
  "skills",
  "technical skills",
  "core competencies",
  "projects",
  "personal projects",
  "certifications",
  "licenses",
  "summary",
  "professional summary",
  "profile",
  "contact",
];

const NON_STANDARD_PATTERNS = [
  { pattern: /my\s+journey/i, name: "My Journey", replaceWith: "Experience" },
  {
    pattern: /where\s+i(?:'ve|\s+have)\s+been/i,
    name: "Where I've Been",
    replaceWith: "Experience",
  },
  { pattern: /what\s+i\s+do/i, name: "What I Do", replaceWith: "Skills / Summary" },
  { pattern: /my\s+story/i, name: "My Story", replaceWith: "Summary" },
  { pattern: /stuff\s+i\s+know/i, name: "Stuff I Know", replaceWith: "Technical Skills" },
  { pattern: /passions/i, name: "Passions", replaceWith: "Projects / Summary" },
  { pattern: /career\s+odyssey/i, name: "Career Odyssey", replaceWith: "Experience" },
];

/**
 * Analyzes layout geometry and heuristics from extracted PDF text items.
 */
export function analyzeATSCompatibilityFromItems(
  items: PDFTextItem[],
  pageCount: number = 1,
  rawTextFallback: string = ""
): ATSReport {
  const findings: ATSFinding[] = [];
  let score = 100;

  const totalChars = items.reduce((sum, item) => sum + item.str.length, 0);
  const characterCount = totalChars > 0 ? totalChars : rawTextFallback.length;

  // 1. Text-as-Image / Character Density Check
  const charsPerPage = pageCount > 0 ? characterCount / pageCount : characterCount;
  const isLowDensity = charsPerPage < 400;

  if (isLowDensity) {
    score -= 30;
    findings.push({
      id: "density-low",
      category: "density",
      severity: "critical",
      title: "Low Text Layer Density (Possible Image PDF)",
      description: `Detected only ~${Math.round(charsPerPage)} characters per page. ATS parsers may fail to extract text from image-based or heavily stylized PDFs.`,
      recommendation:
        "Export your resume directly as a clean PDF from Microsoft Word, Google Docs, or LaTeX without flattening.",
      passed: false,
    });
  } else {
    findings.push({
      id: "density-ok",
      category: "density",
      severity: "info",
      title: "Clean Text Layer",
      description: `Resume contains sufficient selectable text (~${Math.round(charsPerPage)} characters/page).`,
      recommendation: "Ensure text is selectable and not flattened as an image.",
      passed: true,
    });
  }

  // 2. Multi-column Detection
  // Group text items by page and analyze X-coordinates histogram
  let multiColumnDetected = false;
  let columnCount = 1;

  if (items.length > 20) {
    const xCoords = items
      .filter((it) => it.str.trim().length > 3)
      .map((it) => it.transform[4] ?? 0);

    const leftCluster = xCoords.filter((x) => x >= 30 && x < 240).length;
    const rightCluster = xCoords.filter((x) => x >= 260 && x < 550).length;
    const totalSampled = leftCluster + rightCluster;

    if (totalSampled > 30) {
      const leftRatio = leftCluster / totalSampled;
      const rightRatio = rightCluster / totalSampled;

      if (leftRatio > 0.25 && rightRatio > 0.25) {
        multiColumnDetected = true;
        columnCount = 2;
      }
    }
  }

  if (multiColumnDetected) {
    score -= 25;
    findings.push({
      id: "layout-multicolumn",
      category: "layout",
      severity: "critical",
      title: "Multi-Column Layout Detected",
      description:
        "Two-column layouts cause older and standard ATS systems to read across columns horizontally, garbling job roles, dates, and bullet points.",
      recommendation:
        "Convert your layout to a single-column linear layout to guarantee chronological parsing.",
      passed: false,
    });
  } else {
    findings.push({
      id: "layout-single-column",
      category: "layout",
      severity: "info",
      title: "Single-Column Linear Layout",
      description:
        "Single-column layout ensures top-to-bottom linear reading order for ATS parsers.",
      recommendation: "Maintain a standard single-column format.",
      passed: true,
    });
  }

  // 3. Contact Info in Header/Footer Margins
  // Coordinates in PDF: top 8% of standard 842pt height is y > 775, bottom 8% is y < 70
  let contactInMargins = false;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  if (items.length > 0) {
    const marginItems = items.filter((it) => {
      const y = it.transform[5] ?? 0;
      return y > 780 || y < 65; // Top or bottom 8% margins
    });

    const marginText = marginItems.map((it) => it.str).join(" ");
    if (emailRegex.test(marginText) || phoneRegex.test(marginText)) {
      contactInMargins = true;
    }
  }

  if (contactInMargins) {
    score -= 15;
    findings.push({
      id: "contact-margin",
      category: "contact",
      severity: "warning",
      title: "Contact Info Inside Header / Footer Margins",
      description:
        "Contact information was found in the top or bottom 8% margin. Many ATS engines completely strip headers and footers to avoid recurring page numbers.",
      recommendation:
        "Move email, phone number, and links into the main body of the document under your name.",
      passed: false,
    });
  } else {
    findings.push({
      id: "contact-body",
      category: "contact",
      severity: "info",
      title: "Contact Details in Main Body",
      description: "Contact information is located within the standard body area.",
      recommendation: "Keep contact details visible in the main body.",
      passed: true,
    });
  }

  // 4. Non-Standard Headings Detection
  const combinedText = items.length > 0 ? items.map((i) => i.str).join("\n") : rawTextFallback;
  const lines = combinedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const detectedHeadings: string[] = [];
  const nonStandardHeadings: string[] = [];

  for (const line of lines) {
    if (line.length > 40) continue; // Headings are usually concise

    const lowerLine = line.toLowerCase();
    for (const pattern of NON_STANDARD_PATTERNS) {
      if (pattern.pattern.test(lowerLine)) {
        nonStandardHeadings.push(line);
      }
    }

    for (const std of STANDARD_HEADINGS) {
      if (lowerLine === std || lowerLine.startsWith(`${std}:`)) {
        detectedHeadings.push(line);
      }
    }
  }

  if (nonStandardHeadings.length > 0) {
    score -= Math.min(25, nonStandardHeadings.length * 15);
    findings.push({
      id: "headings-nonstandard",
      category: "headings",
      severity: "warning",
      title: `Non-Standard Section Headings: ${nonStandardHeadings.join(", ")}`,
      description:
        "Creative headings like 'My Journey' or 'Stuff I Know' confuse ATS section categorizers and may cause entire experience blocks to be skipped.",
      recommendation:
        "Use universal headings such as 'Work Experience', 'Education', and 'Technical Skills'.",
      passed: false,
    });
  } else {
    findings.push({
      id: "headings-standard",
      category: "headings",
      severity: "info",
      title: "Standard Section Headings",
      description: "Recognized industry-standard section headings detected.",
      recommendation: "Keep clear, traditional section titles.",
      passed: true,
    });
  }

  // 5. Construct Simulated Linear ATS Text View
  // Sort items top-to-bottom, left-to-right (how standard linear parser reads)
  let linearText = "";
  if (items.length > 0) {
    const sorted = [...items].sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      // In PDF, higher Y is higher on the page
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 8) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    linearText = sorted
      .map((it) => it.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } else {
    linearText = rawTextFallback;
  }

  const finalScore = Math.max(20, Math.min(100, score));

  return {
    score: finalScore,
    linearText,
    findings,
    metrics: {
      columnCount,
      pageCount,
      characterCount,
      detectedHeadings: Array.from(new Set(detectedHeadings)),
      nonStandardHeadings: Array.from(new Set(nonStandardHeadings)),
      contactInMargins,
    },
  };
}

/**
 * Runs the ATS compatibility check on a PDF buffer using unpdf text stream extraction.
 */
export async function checkATSCompatibility(
  pdfBuffer: Uint8Array | ArrayBuffer,
  rawTextFallback: string = ""
): Promise<ATSReport> {
  try {
    const buffer = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    const pdf = await getDocumentProxy(buffer);
    const pageCount = pdf.numPages;

    const items: PDFTextItem[] = [];

    for (let p = 1; p <= pageCount; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        if ("str" in item && "transform" in item) {
          items.push({
            str: item.str,
            transform: item.transform,
            width: item.width ?? 0,
            height: item.height ?? 0,
            page: p,
          });
        }
      }
    }

    return analyzeATSCompatibilityFromItems(items, pageCount, rawTextFallback);
  } catch (error) {
    console.warn("[checkATSCompatibility] PDF item extraction fallback:", error);
    // Fallback: analyze rawText heuristics
    return analyzeATSCompatibilityFromItems([], 1, rawTextFallback);
  }
}
