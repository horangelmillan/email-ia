import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const emails = sqliteTable('emails', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  threadId: text('thread_id'),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  subject: text('subject'),
  snippet: text('snippet'),
  body: text('body'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  receivedAt: integer('received_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
