import { describe, expect, it, beforeEach } from 'vitest';
import { createInMemoryDb } from '../client/connection.js';
import { migrate } from '../client/migrate.js';
import { DrizzleVectorStore } from './drizzle-vector-store.js';
import type { Db } from '../client/connection.js';

async function prepareDb(): Promise<Db> {
  const db = await createInMemoryDb();
  await migrate(db, 'packages/db/drizzle');
  await db.$client.execute('DELETE FROM email_chunks');
  await db.$client.execute('DELETE FROM emails');
  return db;
}

async function seedEmail(db: Db, id: string, accountId = 'a1'): Promise<void> {
  await db.$client.execute({
    sql: 'INSERT INTO emails (id, account_id, from_address, to_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, accountId, 'from@test.com', 'to@test.com', Date.now(), Date.now()],
  });
}

describe('DrizzleVectorStore', () => {
  let db: Db;
  let store: DrizzleVectorStore;

  beforeEach(async () => {
    db = await prepareDb();
    store = new DrizzleVectorStore(db);
  });

  it('upsert + searchSimilar ranks correctly', async () => {
    await seedEmail(db, 'e1', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'hello world', embedding: [1, 0] },
      { emailId: 'e1', accountId: 'a1', index: 1, content: 'bye world', embedding: [0, 1] },
    ]);

    const res = await store.searchSimilar([1, 0], 1);
    expect(res).toHaveLength(1);
    expect(res[0]!.chunk.content).toBe('hello world');
    expect(res[0]!.score).toBeCloseTo(1, 5);
  });

  it('searchSimilar filters by accountId', async () => {
    await seedEmail(db, 'e1', 'a1');
    await seedEmail(db, 'e2', 'a2');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'hello a1', embedding: [1, 0] },
    ]);
    await store.upsertChunks('e2', [
      { emailId: 'e2', accountId: 'a2', index: 0, content: 'hello a2', embedding: [1, 0] },
    ]);

    const all = await store.searchSimilar([1, 0], 10);
    expect(all).toHaveLength(2);

    const filtered = await store.searchSimilar([1, 0], 10, 'a1');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.chunk.accountId).toBe('a1');
  });

  it('listChunks returns chunks for emailId', async () => {
    await seedEmail(db, 'e1', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'c0', embedding: [1, 0] },
      { emailId: 'e1', accountId: 'a1', index: 1, content: 'c1', embedding: [0, 1] },
    ]);

    const chunks = await store.listChunks('e1');
    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.content).sort()).toEqual(['c0', 'c1']);
    expect(chunks[0]!.createdAt).toBeInstanceOf(Date);
  });

  it('deleteByEmailId removes chunks', async () => {
    await seedEmail(db, 'e1', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'to delete', embedding: [1, 0] },
    ]);
    expect(await store.listChunks('e1')).toHaveLength(1);

    await store.deleteByEmailId('e1');
    expect(await store.listChunks('e1')).toHaveLength(0);
    expect(await store.searchSimilar([1, 0], 10)).toHaveLength(0);
  });

  it('upsert replaces existing chunks', async () => {
    await seedEmail(db, 'e1', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'old', embedding: [1, 0] },
    ]);
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'new', embedding: [0, 1] },
    ]);

    const chunks = await store.listChunks('e1');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toBe('new');
  });

  it('searchSimilar handles invalid embedding JSON gracefully', async () => {
    await seedEmail(db, 'e1', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'valid', embedding: [1, 0] },
    ]);
    // corrupt embedding directly
    await db.$client.execute({
      sql: 'UPDATE email_chunks SET embedding = ? WHERE id = ?',
      args: ['not-json', 'e1:0'],
    });

    const res = await store.searchSimilar([1, 0], 10);
    expect(res).toHaveLength(1);
    expect(res[0]!.score).toBe(0);
  });

  it('searchSimilar respects limit', async () => {
    await seedEmail(db, 'e1', 'a1');
    await seedEmail(db, 'e2', 'a1');
    await seedEmail(db, 'e3', 'a1');
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'c1', embedding: [1, 0] },
    ]);
    await store.upsertChunks('e2', [
      { emailId: 'e2', accountId: 'a1', index: 0, content: 'c2', embedding: [1, 0] },
    ]);
    await store.upsertChunks('e3', [
      { emailId: 'e3', accountId: 'a1', index: 0, content: 'c3', embedding: [1, 0] },
    ]);

    const res = await store.searchSimilar([1, 0], 2);
    expect(res).toHaveLength(2);
  });
});
