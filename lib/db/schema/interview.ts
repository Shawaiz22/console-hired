import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { jobDescriptions, resumes } from "./documents";

export const interviewStatusEnum = pgEnum("interview_status", [
  "in_progress",
  "completed",
  "cancelled",
]);

export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    jobDescriptionId: uuid("job_description_id")
      .notNull()
      .references(() => jobDescriptions.id, { onDelete: "cascade" }),
    status: interviewStatusEnum("status").default("in_progress").notNull(),
    questions: jsonb("questions").notNull(),
    overallScore: integer("overall_score"),
    summary: jsonb("summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("interview_sessions_user_id_idx").on(t.userId)]
);

export const interviewAnswers = pgTable(
  "interview_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    questionIndex: integer("question_index").notNull(),
    answerText: text("answer_text").notNull(),
    inputMode: text("input_mode").default("text").notNull(),
    evaluation: jsonb("evaluation"),
    deliveryMetrics: jsonb("delivery_metrics"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("interview_answers_session_id_idx").on(t.sessionId)]
);
