import { pgTable, text } from "drizzle-orm/pg-core";
export const documentTable = pgTable("document_table", { id: text("id").primaryKey() });
