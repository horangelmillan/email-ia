import { IntegrationError } from '@email-ia/core';
import type {
  EmailProviderId,
  EmailProviderListOptions,
  EmailProviderListResult,
  EmailProviderMessage,
  EmailProviderPort,
} from '@email-ia/core';

export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

const REQUEST_TIMEOUT_MS = 30_000;

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (!trimmed) throw new IntegrationError('baseUrl es obligatoria', 400);
  return trimmed;
}

export interface HttpEmailProviderConfig {
  providerId: EmailProviderId;
  baseUrl: string;
}

export class HttpEmailProvider implements EmailProviderPort {
  readonly providerId: EmailProviderId;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: HttpEmailProviderConfig, fetchImpl: FetchLike = globalThis.fetch) {
    if (!config.providerId) throw new IntegrationError('providerId es obligatorio', 400);
    this.providerId = config.providerId;
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetchImpl = fetchImpl;
  }

  async listMessages(
    accountId: string,
    options: EmailProviderListOptions = {},
  ): Promise<EmailProviderListResult> {
    const url = new URL(`${this.baseUrl}/messages`);
    url.searchParams.set('accountId', accountId);
    if (options.maxResults !== undefined)
      url.searchParams.set('maxResults', String(options.maxResults));
    if (options.pageToken !== undefined) url.searchParams.set('pageToken', options.pageToken);

    const data = await this.request<{ messages?: unknown[]; nextPageToken?: string }>(url, 'GET');
    const raw = Array.isArray(data.messages) ? data.messages : [];
    const messages = raw.map((m) => this.normalizeMessage(m as Record<string, unknown>));
    const result: EmailProviderListResult = { messages };
    if (data.nextPageToken !== undefined) result.nextPageToken = data.nextPageToken;
    return result;
  }

  async getMessage(accountId: string, messageId: string): Promise<EmailProviderMessage | null> {
    const url = new URL(`${this.baseUrl}/messages/${encodeURIComponent(messageId)}`);
    url.searchParams.set('accountId', accountId);
    try {
      const data = await this.request<Record<string, unknown>>(url, 'GET');
      if (!data || typeof data.id !== 'string') return null;
      return this.normalizeMessage(data);
    } catch (error) {
      if (error instanceof IntegrationError && error.status === 404) return null;
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = new URL(`${this.baseUrl}/health`);
      const res = await this.fetchImpl(url, {
        method: 'GET',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private normalizeMessage(raw: Record<string, unknown>): EmailProviderMessage {
    return {
      id: String(raw.id ?? ''),
      threadId: raw.threadId === undefined || raw.threadId === null ? null : String(raw.threadId),
      from: String(raw.from ?? ''),
      to: Array.isArray(raw.to) ? (raw.to as unknown[]).map(String) : [],
      subject: raw.subject === undefined || raw.subject === null ? null : String(raw.subject),
      snippet: raw.snippet === undefined || raw.snippet === null ? null : String(raw.snippet),
      body: raw.body === undefined || raw.body === null ? null : String(raw.body),
      receivedAt: raw.receivedAt ? new Date(String(raw.receivedAt)) : null,
      isRead: Boolean(raw.isRead),
    };
  }

  private async request<T>(url: URL, method: string): Promise<T> {
    const res = await this.fetchImpl(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new IntegrationError(`HTTP ${res.status} ${url.pathname}`, res.status);
    }
    return (await res.json()) as T;
  }
}
