import { pgTable, text } from 'drizzle-orm/pg-core'
export const interviewtable = pgTable('interview_table', { id: text('id').primaryKey() })