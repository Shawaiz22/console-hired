import { pgTable, text } from "drizzle-orm/pg-core";
export const analysisTable = pgTable("analysis_table", { id: text("id").primaryKey() });
