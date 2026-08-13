import { embedMany } from "ai";
import { embeddingModel } from "@/lib/ai";
import { EvidenceItem, EvidenceStatus } from "../schemas/analysis.schema";

export const STRONG_THRESHOLD = 0.7;
export const PARTIAL_THRESHOLD = 0.55;

export interface EvidenceItemResult {
  requirement: string;
  matchedBullet: string | null;
  similarity: number;
  status: EvidenceStatus;
}

export interface EvidenceMappingResult {
  score: number;
  evidenceMap: EvidenceItem[];
  rawEmbeddings?: {
    responsibilities: Array<{ text: string; vector: number[] }>;
    bullets: Array<{ text: string; vector: number[] }>;
  };
}

/**
 * Batches text embedding requests to Google/AI SDK in a single API call per document.
 */
export async function embedItems(texts: string[]) {
  if (!texts || texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return texts.map((text, i) => ({ text, vector: embeddings[i] }));
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator === 0 ? 0 : dot / denominator;
}

export interface MapEvidenceOptions {
  strongThreshold?: number;
  partialThreshold?: number;
  precomputedResponsibilityVectors?: number[][];
  precomputedBulletVectors?: number[][];
}

/**
 * Maps each JD responsibility to the best matching resume bullet point using cosine similarity on embeddings.
 *
 * Thresholds:
 * - >= strongThreshold (default 0.70): strong match (weight 1.0)
 * - partialThreshold - strongThreshold (default 0.55 - 0.70): partial match (weight 0.5)
 * - < partialThreshold (default 0.55): missing match (weight 0.0, matchedBullet: null)
 *
 * Score is calculated as weighted average (0 - 100).
 */
export async function mapEvidence(
  responsibilities: string[],
  resumeBullets: string[],
  options: MapEvidenceOptions = {}
): Promise<EvidenceMappingResult> {
  const strongThresh = options.strongThreshold ?? STRONG_THRESHOLD;
  const partialThresh = options.partialThreshold ?? PARTIAL_THRESHOLD;

  if (!responsibilities || responsibilities.length === 0) {
    return {
      score: 100,
      evidenceMap: [],
    };
  }

  if (!resumeBullets || resumeBullets.length === 0) {
    return {
      score: 0,
      evidenceMap: responsibilities.map((req) => ({
        requirement: req,
        matchedBullet: null,
        similarity: 0,
        status: "missing",
      })),
    };
  }

  let respVectors = options.precomputedResponsibilityVectors;
  let bulletVectors = options.precomputedBulletVectors;
  let respEmbeddings: Array<{ text: string; vector: number[] }> = [];
  let bulletEmbeddings: Array<{ text: string; vector: number[] }> = [];

  try {
    if (!respVectors) {
      respEmbeddings = await embedItems(responsibilities);
      respVectors = respEmbeddings.map((e) => e.vector);
    }

    if (!bulletVectors) {
      bulletEmbeddings = await embedItems(resumeBullets);
      bulletVectors = bulletEmbeddings.map((e) => e.vector);
    }
  } catch (error) {
    console.warn("Evidence embedding generation failed or offline:", error);
    // Fallback: return missing for all if embeddings cannot be computed
    return {
      score: 0,
      evidenceMap: responsibilities.map((req) => ({
        requirement: req,
        matchedBullet: null,
        similarity: 0,
        status: "missing",
      })),
    };
  }

  const evidenceMap: EvidenceItem[] = [];

  for (let i = 0; i < responsibilities.length; i++) {
    const requirement = responsibilities[i];
    const reqVec = respVectors[i];

    let bestSimilarity = -1;
    let bestBulletIndex = -1;

    if (reqVec) {
      for (let j = 0; j < resumeBullets.length; j++) {
        const bulletVec = bulletVectors[j];
        if (!bulletVec) continue;

        const sim = cosine(reqVec, bulletVec);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestBulletIndex = j;
        }
      }
    }

    const similarity = Math.max(0, Math.round(bestSimilarity * 100) / 100);

    let status: EvidenceStatus = "missing";
    let matchedBullet: string | null = null;

    if (bestSimilarity >= strongThresh && bestBulletIndex >= 0) {
      status = "strong";
      matchedBullet = resumeBullets[bestBulletIndex];
    } else if (bestSimilarity >= partialThresh && bestBulletIndex >= 0) {
      status = "partial";
      matchedBullet = resumeBullets[bestBulletIndex];
    } else {
      status = "missing";
      matchedBullet = null;
    }

    evidenceMap.push({
      requirement,
      matchedBullet,
      similarity,
      status,
    });
  }

  // Calculate weighted average score (strong = 1.0, partial = 0.5, missing = 0.0)
  const totalWeight = evidenceMap.reduce((sum, item) => {
    if (item.status === "strong") return sum + 1.0;
    if (item.status === "partial") return sum + 0.5;
    return sum;
  }, 0);

  const score = Math.round((totalWeight / responsibilities.length) * 100);

  return {
    score,
    evidenceMap,
    rawEmbeddings:
      respEmbeddings.length > 0 && bulletEmbeddings.length > 0
        ? {
            responsibilities: respEmbeddings,
            bullets: bulletEmbeddings,
          }
        : undefined,
  };
}
