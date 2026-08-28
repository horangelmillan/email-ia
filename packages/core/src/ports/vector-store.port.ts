export interface Chunk {
  emailId: string;
  accountId: string;
  index: number;
  content: string;
  embedding: number[];
  createdAt: Date;
}

export interface VectorStorePort {
  upsertChunks(emailId: string, chunks: Omit<Chunk, 'createdAt'>[]): Promise<void>;
  deleteByEmailId(emailId: string): Promise<void>;
  searchSimilar(
    queryEmbedding: number[],
    limit: number,
    accountId?: string,
  ): Promise<{ chunk: Chunk; score: number }[]>;
  listChunks(emailId: string): Promise<Chunk[]>;
}
