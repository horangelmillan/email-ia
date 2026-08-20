import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type {
  Email,
  EmailFilter,
  EmailRepositoryPort,
  CreateEmailInput,
  UpdateEmailInput,
} from '@email-ia/core';
import type { Db } from '../client/index.js';
import { emails } from '../schema/emails.js';

function toDomain(row: typeof emails.$inferSelect): Email {
  return {
    id: row.id,
    accountId: row.accountId,
    threadId: row.threadId,
    fromAddress: row.fromAddress,
    toAddress: row.toAddress,
    subject: row.subject,
    snippet: row.snippet,
    body: row.body,
    isRead: row.isRead,
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEmailRepository implements EmailRepositoryPort {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Email | null> {
    const rows = await this.db.select().from(emails).where(eq(emails.id, id)).limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  }

  async findAll(filter?: EmailFilter): Promise<Email[]> {
    const conditions = [];
    if (filter?.accountId) conditions.push(eq(emails.accountId, filter.accountId));
    if (filter?.isRead !== undefined) conditions.push(eq(emails.isRead, filter.isRead));
    const query = conditions.length
      ? this.db
          .select()
          .from(emails)
          .where(and(...conditions))
      : this.db.select().from(emails);
    const rows = await query;
    return rows.map(toDomain);
  }

  async create(input: CreateEmailInput): Promise<Email> {
    const now = new Date();
    const row = {
      id: input.id ?? randomUUID(),
      accountId: input.accountId,
      threadId: input.threadId ?? null,
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      subject: input.subject ?? null,
      snippet: input.snippet ?? null,
      body: input.body ?? null,
      isRead: input.isRead ?? false,
      receivedAt: input.receivedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.insert(emails).values(row);
    const created = await this.findById(row.id);
    if (!created) throw new Error('Email creation failed');
    return created;
  }

  async update(id: string, input: UpdateEmailInput): Promise<Email | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updates: Partial<typeof emails.$inferInsert> = { updatedAt: new Date() };
    if (input.threadId !== undefined) updates.threadId = input.threadId;
    if (input.subject !== undefined) updates.subject = input.subject;
    if (input.snippet !== undefined) updates.snippet = input.snippet;
    if (input.body !== undefined) updates.body = input.body;
    if (input.isRead !== undefined) updates.isRead = input.isRead;
    if (input.receivedAt !== undefined) updates.receivedAt = input.receivedAt;
    await this.db.update(emails).set(updates).where(eq(emails.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(emails).where(eq(emails.id, id));
    const affected = (result as unknown as { rowsAffected?: number }).rowsAffected ?? 0;
    return affected > 0;
  }
}
