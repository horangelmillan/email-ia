import type { Chunk } from './vector-store.port.js';

export interface RagPort {
  indexEmail(email: {
    id: string;
    accountId: string;
    subject: string | null;
    body: string | null;
  }): Promise<void>;
  indexAccount(accountId: string): Promise<number>;
  search(
    query: string,
    opts?: { limit?: number; accountId?: string },
  ): Promise<{ chunk: Chunk; score: number }[]>;
}

export interface RagConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
}
