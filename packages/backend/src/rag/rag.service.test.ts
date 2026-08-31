import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RagService } from './rag.service.js';
import { RagError, ProviderError } from '@email-ia/core';
import type {
  AIProviderPort,
  EmailRepositoryPort,
  VectorStorePort,
  Chunk,
  Email,
} from '@email-ia/core';

function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class InMemoryVectorStore implements VectorStorePort {
  private map = new Map<string, Chunk[]>();
  upsertCalls: { emailId: string; chunks: Omit<Chunk, 'createdAt'>[] }[] = [];
  deleteCalls: string[] = [];

  async upsertChunks(emailId: string, chunks: Omit<Chunk, 'createdAt'>[]): Promise<void> {
    this.upsertCalls.push({ emailId, chunks });
    await this.deleteByEmailId(emailId);
    if (chunks.length === 0) return;
    const stored: Chunk[] = chunks.map((c) => ({
      ...c,
      createdAt: new Date(),
    }));
    this.map.set(emailId, stored);
  }

  async deleteByEmailId(emailId: string): Promise<void> {
    this.deleteCalls.push(emailId);
    this.map.delete(emailId);
  }

  async listChunks(emailId: string): Promise<Chunk[]> {
    return this.map.get(emailId) ?? [];
  }

  async searchSimilar(
    queryEmbedding: number[],
    limit: number,
    accountId?: string,
  ): Promise<{ chunk: Chunk; score: number }[]> {
    const all: Chunk[] = [];
    for (const chunks of this.map.values()) {
      for (const c of chunks) {
        if (!accountId || c.accountId === accountId) all.push(c);
      }
    }
    const scored = all.map((chunk) => ({
      chunk,
      score: cosine(queryEmbedding, chunk.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

class FakeEmailRepository implements EmailRepositoryPort {
  private map = new Map<string, Email>();

  set(emails: Email[]): void {
    this.map.clear();
    for (const e of emails) this.map.set(e.id, e);
  }

  async findById(id: string): Promise<Email | null> {
    return this.map.get(id) ?? null;
  }

  async findAll(filter?: { accountId?: string }): Promise<Email[]> {
    const all = [...this.map.values()];
    if (filter?.accountId) return all.filter((e) => e.accountId === filter.accountId);
    return all;
  }

  async create(input: {
    id?: string;
    accountId: string;
    fromAddress: string;
    toAddress: string;
    subject?: string | null;
    body?: string | null;
  }): Promise<Email> {
    const id = input.id ?? `m${this.map.size + 1}`;
    const email: Email = {
      id,
      accountId: input.accountId,
      threadId: null,
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      subject: input.subject ?? null,
      snippet: null,
      body: input.body ?? null,
      isRead: false,
      receivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.map.set(id, email);
    return email;
  }

  async update(): Promise<Email | null> {
    return null;
  }

  async delete(id: string): Promise<boolean> {
    return this.map.delete(id);
  }
}

function createFakeAI(): AIProviderPort & { embed: ReturnType<typeof vi.fn> } {
  const embed = vi.fn(async (texts: string[]) => {
    return texts.map((t) => {
      if (t.includes('hello')) return { vector: [1, 0], model: 'fake' };
      if (t.includes('bye')) return { vector: [0, 1], model: 'fake' };
      // for generic chunk content, make deterministic but distinct
      // use hash of first char
      const code = t.charCodeAt(0) ?? 0;
      return { vector: [code % 2 === 0 ? 1 : 0, code % 2 === 1 ? 1 : 0], model: 'fake' };
    });
  });
  return {
    embed,
    chat: vi.fn(),
    listModels: vi.fn(),
    pullModel: vi.fn(),
  } as unknown as AIProviderPort & { embed: ReturnType<typeof vi.fn> };
}

function emailFixture(over: Partial<Email> & { id: string; accountId: string }): Email {
  return {
    threadId: null,
    fromAddress: 'from@test.com',
    toAddress: 'to@test.com',
    subject: null,
    snippet: null,
    body: null,
    isRead: false,
    receivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe('RagService', () => {
  let ai: ReturnType<typeof createFakeAI>;
  let store: InMemoryVectorStore;
  let repo: FakeEmailRepository;

  beforeEach(() => {
    ai = createFakeAI();
    store = new InMemoryVectorStore();
    repo = new FakeEmailRepository();
  });

  it('indexEmail creates chunks and upserts', async () => {
    const svc = new RagService(ai, store, repo, { chunkSize: 4, chunkOverlap: 1 });
    await svc.indexEmail({
      id: 'e1',
      accountId: 'a1',
      subject: 'hello',
      body: ' world',
    });
    // content = "hello\n world" ? after join subject+body strip -> "hello\nworld"? Let's just check embedding called and store has chunks
    expect(ai.embed).toHaveBeenCalled();
    const chunks = await store.listChunks('e1');
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]!.accountId).toBe('a1');
  });

  it('indexEmail deletes previous chunks on re-index (upsert replaces)', async () => {
    const svc = new RagService(ai, store, repo, { chunkSize: 10, chunkOverlap: 0 });
    await svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'hello world', body: null });
    const first = await store.listChunks('e1');
    expect(first).toHaveLength(2); // "hello world" 11 chars with size 10 -> 2 chunks
    await svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'bye', body: null });
    const second = await store.listChunks('e1');
    expect(second).toHaveLength(1);
    expect(second[0]!.content).toBe('bye');
  });

  it('indexEmail deletes when content empty', async () => {
    const svc = new RagService(ai, store, repo);
    // seed store with existing chunk
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'old', embedding: [1, 0] },
    ]);
    expect(await store.listChunks('e1')).toHaveLength(1);
    await svc.indexEmail({ id: 'e1', accountId: 'a1', subject: null, body: '   ' });
    expect(await store.listChunks('e1')).toHaveLength(0);
    expect(ai.embed).not.toHaveBeenCalled();
  });

  it('indexEmail handles body with signature stripped leaving empty → deletes', async () => {
    const svc = new RagService(ai, store, repo);
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'old', embedding: [1, 0] },
    ]);
    await svc.indexEmail({
      id: 'e1',
      accountId: 'a1',
      subject: null,
      body: '\n--\nsignature only?',
    });
    // after strip, body becomes '' and subject null => empty => delete
    expect(await store.listChunks('e1')).toHaveLength(0);
  });

  it('search returns ranked results', async () => {
    const svc = new RagService(ai, store, repo);
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'hello world', embedding: [1, 0] },
      { emailId: 'e1', accountId: 'a1', index: 1, content: 'bye world', embedding: [0, 1] },
    ]);
    // fake embed for query "hello" returns [1,0]
    const res = await svc.search('hello', { limit: 1 });
    expect(res).toHaveLength(1);
    expect(res[0]!.chunk.content).toBe('hello world');
    expect(res[0]!.score).toBeCloseTo(1);
  });

  it('search returns [] for empty query', async () => {
    const svc = new RagService(ai, store, repo);
    const res = await svc.search('   ');
    expect(res).toEqual([]);
    expect(ai.embed).not.toHaveBeenCalled();
  });

  it('search filters by accountId', async () => {
    const svc = new RagService(ai, store, repo);
    await store.upsertChunks('e1', [
      { emailId: 'e1', accountId: 'a1', index: 0, content: 'hello a1', embedding: [1, 0] },
    ]);
    await store.upsertChunks('e2', [
      { emailId: 'e2', accountId: 'a2', index: 0, content: 'hello a2', embedding: [1, 0] },
    ]);
    const filtered = await svc.search('hello', { limit: 10, accountId: 'a1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.chunk.accountId).toBe('a1');
    const all = await svc.search('hello', { limit: 10 });
    expect(all).toHaveLength(2);
  });

  it('indexAccount batches and returns total', async () => {
    repo.set([
      emailFixture({
        id: 'e1',
        accountId: 'a1',
        subject: 'hello world long text here',
        body: 'more content for chunking',
      }),
      emailFixture({ id: 'e2', accountId: 'a1', subject: 'bye', body: null }),
    ]);
    const svc = new RagService(ai, store, repo, { chunkSize: 5, chunkOverlap: 1, batchSize: 2 });
    const total = await svc.indexAccount('a1');
    expect(total).toBeGreaterThan(0);
    // ensure embed called in batches: e1 has multiple chunks, so multiple calls
    // At least 2 calls (e1 chunks batch + e2)
    expect(ai.embed.mock.calls.length).toBeGreaterThanOrEqual(2);
    const chunksE1 = await store.listChunks('e1');
    const chunksE2 = await store.listChunks('e2');
    expect(chunksE1.length + chunksE2.length).toBe(total);
  });

  it('indexAccount returns 0 when no emails', async () => {
    const svc = new RagService(ai, store, repo);
    const total = await svc.indexAccount('nonexistent');
    expect(total).toBe(0);
    expect(ai.embed).not.toHaveBeenCalled();
  });

  it('wraps ProviderError into RagError on embed failure', async () => {
    ai.embed = vi.fn(async () => {
      throw new ProviderError('provider down', 500);
    }) as unknown as typeof ai.embed;
    const svc = new RagService(ai, store, repo);
    await expect(
      svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'hello', body: null }),
    ).rejects.toBeInstanceOf(RagError);
  });

  it('throws RagError on embedding length mismatch', async () => {
    ai.embed = vi.fn(async (texts: string[]) => {
      // return one less
      return texts.slice(0, 1).map(() => ({ vector: [1, 0], model: 'fake' }));
    }) as unknown as typeof ai.embed;
    const svc = new RagService(ai, store, repo, { chunkSize: 3, chunkOverlap: 0 });
    await expect(
      svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'abcdef', body: null }),
    ).rejects.toBeInstanceOf(RagError);
  });

  it('search wraps embed failure into RagError', async () => {
    ai.embed = vi.fn(async () => {
      throw new ProviderError('fail', 500);
    }) as unknown as typeof ai.embed;
    const svc = new RagService(ai, store, repo);
    await expect(svc.search('hello')).rejects.toBeInstanceOf(RagError);
  });

  it('wraps store upsert failure into RagError', async () => {
    const failingStore = {
      upsertChunks: vi.fn(async () => {
        throw new Error('db fail');
      }),
      deleteByEmailId: vi.fn(async () => {}),
      searchSimilar: vi.fn(),
      listChunks: vi.fn(),
    } as unknown as VectorStorePort;
    const svc = new RagService(ai, failingStore, repo, { chunkSize: 10, chunkOverlap: 0 });
    await expect(
      svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'hello', body: null }),
    ).rejects.toBeInstanceOf(RagError);
  });

  it('wraps store search failure into RagError', async () => {
    const failingStore = {
      upsertChunks: vi.fn(),
      deleteByEmailId: vi.fn(),
      searchSimilar: vi.fn(async () => {
        throw new Error('search fail');
      }),
      listChunks: vi.fn(),
    } as unknown as VectorStorePort;
    const svc = new RagService(ai, failingStore, repo);
    await expect(svc.search('hello')).rejects.toBeInstanceOf(RagError);
  });

  it('uses defaults chunkSize 512 overlap 50 batch 20', async () => {
    const svc = new RagService(ai, store, repo);
    // create long text 600 chars -> should be 2 chunks with defaults 512/50 step 462
    const long = 'a'.repeat(600);
    await svc.indexEmail({ id: 'e1', accountId: 'a1', subject: long, body: null });
    const chunks = await store.listChunks('e1');
    expect(chunks.length).toBe(2);
    expect(ai.embed).toHaveBeenCalledTimes(1); // batch 20 covers 2 chunks
  });

  it('respects cfg overrides', async () => {
    const svc = new RagService(ai, store, repo, { chunkSize: 4, chunkOverlap: 0, batchSize: 1 });
    await svc.indexEmail({ id: 'e1', accountId: 'a1', subject: 'abcdefgh', body: null });
    // 8 chars / size 4 -> 2 chunks, batch 1 => 2 embed calls
    expect(ai.embed).toHaveBeenCalledTimes(2);
  });

  it('search uses default limit 5', async () => {
    const svc = new RagService(ai, store, repo);
    for (let i = 0; i < 10; i++) {
      await store.upsertChunks(`e${i}`, [
        { emailId: `e${i}`, accountId: 'a1', index: 0, content: `c${i}`, embedding: [1, 0] },
      ]);
    }
    const res = await svc.search('hello');
    expect(res).toHaveLength(5);
  });
});
