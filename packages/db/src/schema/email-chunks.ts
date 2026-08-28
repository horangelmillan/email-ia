import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { emails } from './emails.js';

export const emailChunks = sqliteTable('email_chunks', {
  id: text('id').primaryKey(),
  emailId: text('email_id')
    .notNull()
    .references(() => emails.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
