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

export const MIN_ANSWER_LENGTH = 50;

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
