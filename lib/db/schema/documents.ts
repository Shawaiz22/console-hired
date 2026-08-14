import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    rawText: text("raw_text").notNull(),
    textHash: text("text_hash").notNull(),
    parsed: jsonb("parsed"),
    atsReport: jsonb("ats_report"),
    embeddings: jsonb("embeddings"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("resumes_text_hash_idx").on(t.textHash), index("resumes_user_id_idx").on(t.userId)]
);

export const jobDescriptions = pgTable(
  "job_descriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    company: text("company"),
    rawText: text("raw_text").notNull(),
    textHash: text("text_hash").notNull(),
    parsed: jsonb("parsed"),
    embeddings: jsonb("embeddings"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("jd_text_hash_idx").on(t.textHash), index("jd_user_id_idx").on(t.userId)]
);
