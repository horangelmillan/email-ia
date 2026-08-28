import type { EmailProviderPort, EmailRepositoryPort, RagPort } from '@email-ia/core';

export interface SyncResult {
  synced: number;
  accountId: string;
}

export interface SyncOptions {
  maxResultsPerPage?: number | undefined;
}

/**
 * Offline-first incremental sync: source of truth is local DB.
 * Fetches all pages from provider (via pageToken loop) and upserts into repo.
 * Server wins for metadata (subject/snippet/body/isRead/threadId/receivedAt).
 * Idempotent: re-sync same data does not duplicate.
 */
export class EmailSyncService {
  constructor(
    private readonly provider: EmailProviderPort,
    private readonly repo: EmailRepositoryPort,
    private readonly rag?: RagPort,
  ) {}

  async syncAccount(accountId: string, options: SyncOptions = {}): Promise<SyncResult> {
    if (!accountId) throw new Error('accountId es obligatorio');
    let pageToken: string | undefined = undefined;
    let synced = 0;

    do {
      const result = await this.provider.listMessages(accountId, {
        maxResults: options.maxResultsPerPage,
        pageToken,
      });

      for (const msg of result.messages) {
        const existing = await this.repo.findById(msg.id);
        if (existing) {
          await this.repo.update(msg.id, {
            threadId: msg.threadId,
            subject: msg.subject,
            snippet: msg.snippet,
            body: msg.body,
            isRead: msg.isRead,
            receivedAt: msg.receivedAt,
          });
        } else {
          await this.repo.create({
            id: msg.id,
            accountId,
            threadId: msg.threadId,
            fromAddress: msg.from,
            toAddress: msg.to.join(','),
            subject: msg.subject,
            snippet: msg.snippet,
            body: msg.body,
            isRead: msg.isRead,
            receivedAt: msg.receivedAt,
          });
        }

        try {
          await this.rag?.indexEmail({
            id: msg.id,
            accountId,
            subject: msg.subject ?? null,
            body: msg.body ?? null,
          });
        } catch (e) {
          console.warn('[EmailSyncService] rag.indexEmail failed', e);
        }

        synced++;
      }

      pageToken = result.nextPageToken;
    } while (pageToken);

    return { synced, accountId };
  }
}

export async function syncAccount(
  accountId: string,
  provider: EmailProviderPort,
  repo: EmailRepositoryPort,
  options: SyncOptions = {},
  rag?: RagPort,
): Promise<SyncResult> {
  const svc = new EmailSyncService(provider, repo, rag);
  return svc.syncAccount(accountId, options);
}
