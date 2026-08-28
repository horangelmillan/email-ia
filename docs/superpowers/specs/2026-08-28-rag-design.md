# Fase 5A RAG — embeddings / chunking / vector store Design

> Spec Fase 5A (A→B→C autorizado 2026-08-28). Implementa `ARCHITECTURE_DECISIONS.md:3.7` Embedding strategy con proveedor actual.

**Objetivo:** Indexar emails (body+subject) en vector store local offline-first para búsqueda semántica vía `AIProviderPort.embed`, sin deps nativas.

**Contexto:** `AIProviderPort.embed(texts)` ya en `packages/core/src/ports/ai-provider.port.ts:29` (DI fetch, Ollama/LM Studio/OpenAI). `emails` tabla `packages/db/src/schema/emails.ts:1` sin vector. `EmailSyncService` hace upsert `EmailRepositoryPort` server-wins con paginación `pageToken`. Stack Drizzle + libSQL `encryptionKey` + `SecretStorePort` (ADR-004), `Factory` multi-runtime (ADR-005), CI `quality`+CodeQL (ADR-007), Observabilidad Pino/OTel (ADR-009). Base `v0.4.0` + runbooks `PR #22`.

## 1. Arquitectura

Hexagonal `shared←core←db|ai-provider←backend←electron` (ADR-001/002/003) preservada.

- `packages/core` define puertos `RagPort`, `VectorStorePort` y `RagError extends AppError` (code `RAG_ERROR`). No depende de `drizzle`/`ai-provider`.
- `packages/db` adapta `DrizzleVectorStore implements VectorStorePort` (Drizzle `sqliteTable`, libSQL `createClient`). Orden `core→db`.
- `packages/backend` orquesta `RagService implements RagPort` vía DI `AIProviderPort` + `VectorStorePort` + `EmailRepositoryPort`. Hook opcional en `EmailSyncService` tras upsert.
- `packages/ai-provider` sin cambios; reusa `OpenAICompatibleProvider.embed` / `OllamaProvider.embed`.
- `packages/electron` / `frontend` no tocados Fase 5A (B/C después).

Global Constraints:

- Node 22 LTS (`.nvmrc`), pnpm 11 (`pnpm-workspace.yaml`, `allowBuilds {electron:true, esbuild:true, better-sqlite3:false, protobufjs:false, msw:true}`), TypeScript ESNext/Bundler + NodeNext (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
- Drizzle `0.45+` + `@libsql/client` + `drizzle-kit`, `zod 4.4.3`, `pino`, `vitest 4` coverage `vitest.config.ts:24` 80% statements/branches/functions/lines, `eslint` flat + `prettier` `eol=lf` (`.gitattributes`).
- `core.autocrlf false`, `sandbox:true` `preload.cjs` (ADR-006).

## 2. Componentes y Contratos

### `packages/core/src/ports/vector-store.port.ts`

```ts
export interface Chunk {
  emailId: string;
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
```

### `packages/core/src/ports/rag.port.ts`

```ts
export interface RagPort {
  indexEmail(email: {
    id: string;
    accountId: string;
    subject: string | null;
    body: string | null;
  }): Promise<void>;
  indexAccount(accountId: string): Promise<number>; // nº chunks
  search(
    query: string,
    opts?: { limit?: number; accountId?: string },
  ): Promise<{ chunk: Chunk; score: number }[]>;
}
export interface RagConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
} // defaults 512/50/20
```

### `packages/core/src/errors/rag-error.ts`

```ts
export class RagError extends AppError {
  constructor(msg: string, details?: unknown) {
    super(msg, 400, 'RAG_ERROR', details);
  }
}
```

### `packages/db/src/schema/email-chunks.ts`

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { emails } from './emails';
export const emailChunks = sqliteTable('email_chunks', {
  id: text('id').primaryKey(), // `${emailId}:${index}`
  emailId: text('email_id')
    .notNull()
    .references(() => emails.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(), // JSON.stringify(number[])
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
```

### `packages/db/src/repositories/drizzle-vector-store.ts`

- `DrizzleVectorStore implements VectorStorePort` ctor `(db: LibSQLDatabase)`.
- `upsertChunks`: `deleteByEmailId` + `insert` batch.
- `searchSimilar`: `select * from email_chunks where (?acId null or accountId=?)`, parse `embedding JSON`, cosine `dot/(sqrt(sumSqA)*sqrt(sumSqB))`, sort desc, slice `limit`.
- Helpers: `cosine(a:number[],b:number[])`, `parseEmbedding(s:string)`.

### `packages/backend/src/rag/chunk.ts`

```ts
export function stripSignatures(body: string): string; // corta en `\n--\n`, `\nEnviado desde`, `____`, `> `
export function chunkText(text: string, opts: { size: number; overlap: number }): string[];
```

### `packages/backend/src/rag/rag.service.ts`

```ts
export class RagService implements RagPort {
  constructor(private ai: AIProviderPort, private store: VectorStorePort, private emails: EmailRepositoryPort, private cfg: RagConfig){}
  async indexEmail(email): Promise<void> // strip+chunk+embed batch→upsert, delete previo, RagError si embed falla
  async search(query, opts): Promise<...> // embed query → store.searchSimilar
}
```

## 3. Flujo Datos

1. `EmailSyncService.syncAccount(accountId)` lista `HttpEmailProvider` paginado `pageToken`, upsert `DrizzleEmailRepository`. Si `ragService` DI presente, tras `create/update` → `await ragService.indexEmail(email)` (fire-and-forget opcional, no bloquea sync).
2. `indexEmail`: `content = [subject, stripSignatures(body)].filter(Boolean).join('\n')` → `chunks = chunkText(content, {512,50})` → `embeddings = await ai.embed(chunks)` (batch 20) → `store.upsertChunks(emailId, chunks.map((c,i)=>({emailId, index:i, content:c, embedding: embeddings[i].vector})))`.
3. `search(query)`: `qEmb = (await ai.embed([query]))[0].vector` → `store.searchSimilar(qEmb, limit)`.
4. Re-index incremental: `indexAccount` itera `emails` por `accountId` → `indexEmail` cada uno.

## 4. Manejo Errores

- `RagError` unifica `ProviderError` (timeout 30s, `IntegrationError` no aplica) y `DbError`. Mapeado por `packages/backend/src/app.ts: errorHandler AppError→status/code/details` else 500.
- `embed` vacío → `RagError 400 RAG_ERROR`.
- `store` JSON parse fail → `RagError`.

## 5. Testing

TDD rojo→verde ( `test-driven-development` + `verification-before-completion`).

- Unit `packages/backend/src/rag/chunk.test.ts`: `stripSignatures` y `chunkText` overlap.
- Unit `packages/db/src/repositories/drizzle-vector-store.test.ts`: `createInMemoryDb()` + `migrate()`, upsert/list/delete, `searchSimilar` cosine ranking, account filter.
- Integration `packages/backend/src/rag/rag.service.test.ts`: DI `FakeAIProvider {embed: vi.fn(async t=> t.map((s,i)=>({vector:[i%3===0?1:0, ...], model:'fake'})))}` + `DrizzleVectorStore` memory, `indexEmail` batch, `search` ranking.
- Coverage ≥80%, `pnpm lint/format:check/typecheck/build/test:coverage` verdes, `allowBuilds` sin cambios.

## 6. Migraciones

`packages/db/drizzle/0002_rag_chunks.sql` + `meta/_journal.json` via `drizzle-kit generate`. `packages/db/src/client/migrate.ts` aplica.

## 7. No Alcance Fase 5A

- HTTP `GET /rag/search`, UI5 Inbox semántica, prompts versionados/golden dataset (Fase 5B), `sqlite-vec` ANN, adjuntos, `vector` tipo nativo Drizzle.

## 8. Validación

- `pnpm build` tsc + `ui5 build`, `pnpm test:coverage` 137→~150 tests, `quality`+CodeQL verde PR `feature/fase5a-rag` → `develop`.

---

Spec self-review: sin TBD/TODO, tipos consistentes `Chunk`/`VectorStorePort`/`RagPort`, cobertura 3.7 completa, YAGNI aplicado, dependency rule intacta.
