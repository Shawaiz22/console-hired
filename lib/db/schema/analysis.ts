import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { jobDescriptions, resumes } from "./documents";

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const analyses = pgTable(
  "analyses",
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
    status: analysisStatusEnum("status").default("pending").notNull(),
    overallScore: integer("overall_score"),
    breakdown: jsonb("breakdown"),
    evidenceMap: jsonb("evidence_map"),
    gaps: jsonb("gaps"),
    suggestions: jsonb("suggestions"),
    errorMessage: text("error_message"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("analyses_user_id_idx").on(t.userId)]
);
