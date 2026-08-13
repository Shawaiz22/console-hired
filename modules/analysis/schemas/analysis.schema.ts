import { z } from "zod";

export const EvidenceStatusSchema = z.enum(["strong", "partial", "missing"]);

export const EvidenceItemSchema = z.object({
  requirement: z.string(),
  matchedBullet: z.string().nullable(),
  similarity: z.number(),
  status: EvidenceStatusSchema,
});

export const ScoreBreakdownSchema = z.object({
  skillCoverage: z.number().min(0).max(100),
  experienceFit: z.number().min(0).max(100),
  responsibilityEvidence: z.number().min(0).max(100),
  atsHygiene: z.number().min(0).max(100),
});

export const GapSchema = z.object({
  skill: z.string(),
  required: z.boolean(),
  reason: z.string(),
});

export const SuggestionSchema = z.object({
  original: z.string().nullable(),
  improved: z.string(),
  rationale: z.string(),
});

export const AnalysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: ScoreBreakdownSchema,
  evidenceMap: z.array(EvidenceItemSchema),
  gaps: z.array(GapSchema),
  suggestions: z.array(SuggestionSchema),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type Gap = z.infer<typeof GapSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
