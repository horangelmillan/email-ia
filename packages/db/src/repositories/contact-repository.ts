import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type {
  Contact,
  ContactRepositoryPort,
  CreateContactInput,
  UpdateContactInput,
} from '@email-ia/core';
import type { Db } from '../client/index.js';
import { contacts } from '../schema/contacts.js';

function toDomain(row: typeof contacts.$inferSelect): Contact {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleContactRepository implements ContactRepositoryPort {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Contact | null> {
    const rows = await this.db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Contact | null> {
    const rows = await this.db.select().from(contacts).where(eq(contacts.email, email)).limit(1);
    return rows[0] ? toDomain(rows[0]) : null;
  }

  async findAll(): Promise<Contact[]> {
    const rows = await this.db.select().from(contacts);
    return rows.map(toDomain);
  }

  async create(input: CreateContactInput): Promise<Contact> {
    const now = new Date();
    const row = {
      id: input.id ?? randomUUID(),
      email: input.email,
      displayName: input.displayName ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.insert(contacts).values(row);
    const created = await this.findById(row.id);
    if (!created) throw new Error('Contact creation failed');
    return created;
  }

  async update(id: string, input: UpdateContactInput): Promise<Contact | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updates: Partial<typeof contacts.$inferInsert> = { updatedAt: new Date() };
    if (input.email !== undefined) updates.email = input.email;
    if (input.displayName !== undefined) updates.displayName = input.displayName ?? null;
    await this.db.update(contacts).set(updates).where(eq(contacts.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(contacts).where(eq(contacts.id, id));
    // libSQL returns rowsAffected
    const affected = (result as unknown as { rowsAffected?: number }).rowsAffected ?? 0;
    return affected > 0;
  }
}
