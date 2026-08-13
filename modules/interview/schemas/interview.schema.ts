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

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
