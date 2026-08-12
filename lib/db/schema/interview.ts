import { pgTable, text } from "drizzle-orm/pg-core";
export const interviewTable = pgTable("interview_table", { id: text("id").primaryKey() });
