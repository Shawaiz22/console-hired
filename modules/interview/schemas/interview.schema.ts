import { z } from "zod";

export const QuestionTypeSchema = z.enum(["technical", "behavioral"]);

export const InterviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: QuestionTypeSchema,
  targetSkill: z.string(),
  whyAsked: z.string(),
});

export const StarFrameworkSchema = z.object({
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
});

export const AnswerEvaluationSchema = z.object({
  clarity: z.number().min(1).max(5),
  relevance: z.number().min(1).max(5),
  completeness: z.number().min(1).max(5),
  specificity: z.number().min(1).max(5),
  star: StarFrameworkSchema.nullable(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export const SessionSummarySchema = z.object({
  overallImpression: z.string(),
  topStrengths: z.array(z.string()),
  focusAreas: z.array(z.string()),
});

export const StartInterviewSchema = z.object({
  resumeId: z.string().uuid("Please select a valid resume"),
  jobDescriptionId: z.string().uuid("Please select a valid job description"),
});

/** How the candidate sounded. Scored from the audio, never from the transcript. */
export const DeliveryAnalysisSchema = z.object({
  pace: z.number().min(1).max(5),
  vocalVariation: z.number().min(1).max(5),
  fluency: z.number().min(1).max(5),
  articulation: z.number().min(1).max(5),
  observations: z.array(z.string()).max(3),
});

/**
 * The numbers are computed in code; `analysis` is the only model-derived part and
 * is null whenever the audio call failed, so the card can degrade instead of faking it.
 */
export const DeliveryMetricsSchema = z.object({
  wordsPerMinute: z.number(),
  wordCount: z.number(),
  durationSeconds: z.number(),
  fillerCount: z.number(),
  fillerRate: z.number(),
  analysis: DeliveryAnalysisSchema.nullable(),
});

export const MIN_ANSWER_LENGTH = 50;

/** 3 minutes of webm at ~64kbps, base64-encoded, stays well under the 4.5MB request cap. */
export const MAX_AUDIO_BASE64_LENGTH = 4_000_000;

/** Shared by the answer form and POST /api/v1/interviews/[id]/answers. */
export const AnswerInputSchema = z.object({
  questionIndex: z.number().int().min(0).max(5),
  answerText: z
    .string()
    .trim()
    .min(
      MIN_ANSWER_LENGTH,
      `Answer must be at least ${MIN_ANSWER_LENGTH} characters for AI evaluation`
    ),
  inputMode: z.enum(["text", "voice"]).default("text"),
  audio: z
    .object({
      base64: z.string().min(1).max(MAX_AUDIO_BASE64_LENGTH),
      durationMs: z.number().int().positive(),
    })
    .optional(),
});

/** The form only owns the answer text; questionIndex comes from session state. */
export const AnswerFormSchema = AnswerInputSchema.pick({ answerText: true });

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type StartInterviewValues = z.infer<typeof StartInterviewSchema>;
export type AnswerInput = z.infer<typeof AnswerInputSchema>;
export type AnswerFormValues = z.infer<typeof AnswerFormSchema>;
export type DeliveryAnalysis = z.infer<typeof DeliveryAnalysisSchema>;
export type DeliveryMetrics = z.infer<typeof DeliveryMetricsSchema>;
