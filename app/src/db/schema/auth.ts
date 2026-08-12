import { pgTable, text } from 'drizzle-orm/pg-core'
export const authTable = pgTable('auth_table', {
    id: text('id').primaryKey(),

})