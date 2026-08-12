import { pgTable, text } from 'drizzle-orm/pg-core'
export const analysistable = pgTable('analysis_table', { id: text('id').primaryKey() })