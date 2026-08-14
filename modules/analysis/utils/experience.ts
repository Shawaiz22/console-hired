/**
 * Experience and Seniority Fit Scoring Engine
 * Pure arithmetic evaluator without AI/embeddings.
 */

export interface ExperienceItem {
  startDate: string;
  endDate: string | null;
  role?: string;
  company?: string;
}

export interface JDExperienceCriteria {
  minYears?: number | null;
  maxYears?: number | null;
  seniority?: string | null;
}

export interface ExperienceFitResult {
  score: number; // 0 - 100
  actualYears: number;
  minYears: number | null;
  maxYears: number | null;
  seniority: string;
  status: "within_range" | "below_minimum" | "above_maximum" | "unassessed";
  unassessed: boolean;
  feedback: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

// Benchmark minimum years associated with seniority levels when numerical years are omitted
const SENIORITY_MIN_YEARS: Record<string, number> = {
  intern: 0,
  junior: 0,
  mid: 2,
  senior: 5,
  lead: 7,
};

/**
 * Tolerant date parser supporting:
 * - "Jan 2022", "January 2022"
 * - "01/2022", "1/2022"
 * - "2022-01", "2022-01-15"
 * - "2022" (defaults to January 1st)
 * - "present", "current", "now", null, undefined -> returns null (treated as present)
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  const lower = trimmed.toLowerCase();

  if (["present", "current", "now", "ongoing", "today"].includes(lower)) {
    return null;
  }

  // 1. ISO or YYYY-MM / YYYY-MM-DD (e.g. "2022-06", "2022-06-15")
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    if (month >= 0 && month <= 11) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  // 2. MM/YYYY or MM-YYYY (e.g. "01/2022", "1/2022")
  const slashMatch = trimmed.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const year = parseInt(slashMatch[2], 10);
    if (month >= 0 && month <= 11) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  // 3. Month Name + Year (e.g. "Jan 2022", "January 2022", "Jan, 2022")
  const monthNameMatch = trimmed.match(/^([a-zA-Z]+)[,\s]+(\d{4})$/);
  if (monthNameMatch) {
    const monthKey = monthNameMatch[1].toLowerCase();
    const year = parseInt(monthNameMatch[2], 10);
    if (monthKey in MONTH_MAP) {
      return new Date(Date.UTC(year, MONTH_MAP[monthKey], 1));
    }
  }

  // 4. Year only (e.g. "2022") -> default to January 1
  const yearOnlyMatch = trimmed.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1], 10);
    return new Date(Date.UTC(year, 0, 1));
  }

  // Fallback: standard Date parse
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

/**
 * Calculates total years of experience from experience date ranges.
 * Treats null endDate as present date.
 */
export function calculateTotalYearsOfExperience(
  experiences: ExperienceItem[],
  referenceDate: Date = new Date()
): number {
  if (!experiences || experiences.length === 0) return 0;

  let totalMonths = 0;

  for (const exp of experiences) {
    const start = parseDate(exp.startDate);
    if (!start) continue;

    const end = exp.endDate ? (parseDate(exp.endDate) ?? referenceDate) : referenceDate;

    if (end < start) continue;

    const yearDiff = end.getUTCFullYear() - start.getUTCFullYear();
    const monthDiff = end.getUTCMonth() - start.getUTCMonth();

    // Estimate total months between start and end date
    const months = yearDiff * 12 + monthDiff;
    if (months > 0) {
      totalMonths += months;
    }
  }

  const years = totalMonths / 12;
  return Math.round(years * 10) / 10;
}

/**
 * Evaluates candidate experience and seniority fit against Job Description criteria.
 *
 * Rules:
 * 1. inside range [minYears, maxYears] -> 100
 * 2. below min -> (actual / min) * 100, floored at 20
 * 3. above max -> 100 (overqualified is not a penalty)
 * 4. JD years are null -> return 75, flagged unassessed (with seniority adjustment if applicable)
 * 5. If JD requires senior level and candidate has limited experience, seniority pulls down score.
 */
export function evaluateExperienceFit(
  actualYearsOrExperience: number | ExperienceItem[],
  criteria: JDExperienceCriteria = {}
): ExperienceFitResult {
  const actualYears =
    typeof actualYearsOrExperience === "number"
      ? Math.max(0, actualYearsOrExperience)
      : calculateTotalYearsOfExperience(actualYearsOrExperience);

  const minYears = criteria.minYears ?? null;
  const maxYears = criteria.maxYears ?? null;
  const seniority = criteria.seniority ?? "unspecified";

  // Case 1: JD years are not specified (null/undefined)
  if (minYears === null && maxYears === null) {
    const benchmarkMin = SENIORITY_MIN_YEARS[seniority.toLowerCase()];

    // If seniority is specified with a benchmark higher than actual experience, adjust score
    if (benchmarkMin !== undefined && benchmarkMin > 0 && actualYears < benchmarkMin) {
      const scaled = Math.round((actualYears / benchmarkMin) * 100);
      const score = Math.max(20, Math.min(75, scaled));
      return {
        score,
        actualYears,
        minYears: null,
        maxYears: null,
        seniority,
        status: "below_minimum",
        unassessed: false,
        feedback: `Position targets a ${seniority} level (~${benchmarkMin}+ years). Candidate has ${actualYears} years.`,
      };
    }

    return {
      score: 75,
      actualYears,
      minYears: null,
      maxYears: null,
      seniority,
      status: "unassessed",
      unassessed: true,
      feedback:
        "Job description does not specify numeric years of experience; assessed at default baseline (75%).",
    };
  }

  // Case 2: Numerical range comparison
  const effectiveMin = minYears ?? 0;
  const effectiveMax = maxYears ?? Infinity;

  // Seniority penalty guard: if JD has a seniority benchmark higher than specified minYears
  const seniorityBenchmark = SENIORITY_MIN_YEARS[seniority.toLowerCase()] ?? 0;
  const targetMin = Math.max(
    effectiveMin,
    seniorityBenchmark > 0 && minYears === null ? seniorityBenchmark : effectiveMin
  );

  if (actualYears < targetMin) {
    const ratio = targetMin > 0 ? (actualYears / targetMin) * 100 : 100;
    const score = Math.max(20, Math.min(100, Math.round(ratio)));
    return {
      score,
      actualYears,
      minYears,
      maxYears,
      seniority,
      status: "below_minimum",
      unassessed: false,
      feedback: `Candidate has ${actualYears} years of experience, below the required minimum of ${targetMin} years.`,
    };
  }

  if (actualYears > effectiveMax && effectiveMax !== Infinity) {
    return {
      score: 100,
      actualYears,
      minYears,
      maxYears,
      seniority,
      status: "above_maximum",
      unassessed: false,
      feedback: `Candidate has ${actualYears} years of experience, exceeding the required range of ${effectiveMin}–${effectiveMax} years.`,
    };
  }

  return {
    score: 100,
    actualYears,
    minYears,
    maxYears,
    seniority,
    status: "within_range",
    unassessed: false,
    feedback: `Candidate's ${actualYears} years of experience aligns with the required ${effectiveMin}${
      maxYears ? `–${maxYears}` : "+"
    } years.`,
  };
}
