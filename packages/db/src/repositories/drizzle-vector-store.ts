import { eq } from 'drizzle-orm';
import type { Chunk, VectorStorePort } from '@email-ia/core';
import type { Db } from '../client/connection.js';
import { emailChunks } from '../schema/email-chunks.js';

export class DrizzleVectorStore implements VectorStorePort {
  constructor(private db: Db) {}

  async upsertChunks(emailId: string, chunks: Omit<Chunk, 'createdAt'>[]): Promise<void> {
    await this.deleteByEmailId(emailId);
    if (chunks.length === 0) return;
    const rows = chunks.map((c) => ({
      id: `${emailId}:${c.index}`,
      emailId,
      accountId: c.accountId,
      chunkIndex: c.index,
      content: c.content,
      embedding: JSON.stringify(c.embedding),
      createdAt: new Date(),
    }));
    await this.db.insert(emailChunks).values(rows);
  }

  async deleteByEmailId(emailId: string): Promise<void> {
    await this.db.delete(emailChunks).where(eq(emailChunks.emailId, emailId));
  }

  async listChunks(emailId: string): Promise<Chunk[]> {
    const rows = await this.db.select().from(emailChunks).where(eq(emailChunks.emailId, emailId));
    return rows.map((r) => toChunk(r));
  }

  async searchSimilar(
    queryEmbedding: number[],
    limit: number,
    accountId?: string,
  ): Promise<{ chunk: Chunk; score: number }[]> {
    const rows = accountId
      ? await this.db.select().from(emailChunks).where(eq(emailChunks.accountId, accountId))
      : await this.db.select().from(emailChunks);

    const scored = rows.map((row) => {
      const parsed = parseEmbedding(row.embedding);
      const score = parsed ? cosine(queryEmbedding, parsed) : 0;
      return { chunk: toChunk(row), score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

function toChunk(row: typeof emailChunks.$inferSelect): Chunk {
  const parsed = parseEmbedding(row.embedding);
  return {
    emailId: row.emailId,
    accountId: row.accountId,
    index: row.chunkIndex,
    content: row.content,
    embedding: parsed ?? [],
    createdAt: row.createdAt,
  };
}

function parseEmbedding(value: string): number[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
      return parsed as number[];
    }
    return null;
  } catch {
    return null;
  }
}

function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
