import { pgTable, text } from 'drizzle-orm/pg-core'
export const documenttable = pgTable('document_table', { id: text('id').primaryKey() })