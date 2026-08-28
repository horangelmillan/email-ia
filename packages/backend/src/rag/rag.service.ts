import { RagError } from '@email-ia/core';
import type {
  AIProviderPort,
  EmailRepositoryPort,
  RagConfig,
  RagPort,
  VectorStorePort,
  Chunk,
} from '@email-ia/core';
import { chunkText, stripSignatures } from './chunk.js';

export class RagService implements RagPort {
  constructor(
    private readonly ai: AIProviderPort,
    private readonly store: VectorStorePort,
    private readonly emails: EmailRepositoryPort,
    private readonly cfg: RagConfig = {},
  ) {}

  private get chunkSize(): number {
    return this.cfg.chunkSize ?? 512;
  }

  private get chunkOverlap(): number {
    return this.cfg.chunkOverlap ?? 50;
  }

  private get batchSize(): number {
    return this.cfg.batchSize ?? 20;
  }

  async indexEmail(email: {
    id: string;
    accountId: string;
    subject: string | null;
    body: string | null;
  }): Promise<void> {
    const content = [email.subject, stripSignatures(email.body ?? '')]
      .filter((v): v is string => Boolean(v))
      .join('\n')
      .trim();

    if (!content) {
      try {
        await this.store.deleteByEmailId(email.id);
      } catch (e) {
        if (e instanceof RagError) throw e;
        throw new RagError('Failed to delete chunks for empty email', e);
      }
      return;
    }

    const chunks = chunkText(content, {
      size: this.chunkSize,
      overlap: this.chunkOverlap,
    });

    if (chunks.length === 0) {
      try {
        await this.store.deleteByEmailId(email.id);
      } catch (e) {
        if (e instanceof RagError) throw e;
        throw new RagError('Failed to delete chunks for empty email', e);
      }
      return;
    }

    const embeddings: { vector: number[]; model: string }[] = [];
    try {
      for (let offset = 0; offset < chunks.length; offset += this.batchSize) {
        const batch = chunks.slice(offset, offset + this.batchSize);
        const res = await this.ai.embed(batch);
        if (res.length !== batch.length) {
          throw new RagError(
            `Embedding length mismatch: expected ${batch.length} got ${res.length}`,
          );
        }
        embeddings.push(...res);
      }
    } catch (e) {
      if (e instanceof RagError) throw e;
      throw new RagError('Failed to embed chunks', e);
    }

    const toUpsert = chunks.map((c, i) => ({
      emailId: email.id,
      accountId: email.accountId,
      index: i,
      content: c,
      embedding: embeddings[i]!.vector,
    }));

    try {
      await this.store.upsertChunks(email.id, toUpsert);
    } catch (e) {
      if (e instanceof RagError) throw e;
      throw new RagError('Failed to upsert chunks', e);
    }
  }

  async indexAccount(accountId: string): Promise<number> {
    let emails: Awaited<ReturnType<EmailRepositoryPort['findAll']>>;
    try {
      emails = await this.emails.findAll({ accountId });
    } catch (e) {
      if (e instanceof RagError) throw e;
      throw new RagError('Failed to list emails for account', e);
    }

    const filtered = emails.filter((e) => e.accountId === accountId);
    if (filtered.length === 0) return 0;

    let total = 0;
    for (const email of filtered) {
      const content = [email.subject, stripSignatures(email.body ?? '')]
        .filter(Boolean)
        .join('\n')
        .trim();
      const expected = content
        ? chunkText(content, {
            size: this.chunkSize,
            overlap: this.chunkOverlap,
          }).length
        : 0;
      await this.indexEmail({
        id: email.id,
        accountId: email.accountId,
        subject: email.subject,
        body: email.body,
      });
      total += expected;
    }
    return total;
  }

  async search(
    query: string,
    opts?: { limit?: number; accountId?: string },
  ): Promise<{ chunk: Chunk; score: number }[]> {
    const q = query.trim();
    if (!q) return [];

    let embeddings: Awaited<ReturnType<AIProviderPort['embed']>>;
    try {
      embeddings = await this.ai.embed([q]);
    } catch (e) {
      if (e instanceof RagError) throw e;
      throw new RagError('Failed to embed query', e);
    }

    const qVec = embeddings[0]?.vector;
    if (!qVec) throw new RagError('Empty embedding for query');

    try {
      return await this.store.searchSimilar(qVec, opts?.limit ?? 5, opts?.accountId);
    } catch (e) {
      if (e instanceof RagError) throw e;
      throw new RagError('Failed to search similar chunks', e);
    }
  }
}
