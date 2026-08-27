import type {
  EmailProviderId,
  EmailProviderListOptions,
  EmailProviderListResult,
  EmailProviderMessage,
  EmailProviderPort,
} from '@email-ia/core';

export class FakeEmailProvider implements EmailProviderPort {
  readonly providerId: EmailProviderId = 'fake';

  private readonly store: Map<string, EmailProviderMessage[]>;

  constructor(initial?: Record<string, EmailProviderMessage[]>) {
    this.store = new Map(Object.entries(initial ?? {}));
  }

  async listMessages(
    accountId: string,
    options: EmailProviderListOptions = {},
  ): Promise<EmailProviderListResult> {
    const all = this.store.get(accountId) ?? [];
    const offset = options.pageToken ? Number.parseInt(options.pageToken, 10) : 0;
    const start = Number.isNaN(offset) || offset < 0 ? 0 : offset;
    const limit = options.maxResults ?? all.length;
    const slice = all.slice(start, start + limit);
    const nextOffset = start + slice.length;
    const nextPageToken = nextOffset < all.length ? String(nextOffset) : undefined;
    return nextPageToken ? { messages: slice, nextPageToken } : { messages: slice };
  }

  async getMessage(accountId: string, messageId: string): Promise<EmailProviderMessage | null> {
    const all = this.store.get(accountId) ?? [];
    return all.find((m) => m.id === messageId) ?? null;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  seed(accountId: string, messages: EmailProviderMessage[]): void {
    this.store.set(accountId, [...messages]);
  }
}
