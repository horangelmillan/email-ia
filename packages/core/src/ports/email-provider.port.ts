export type EmailProviderId = 'gmail' | 'outlook' | 'imap' | 'fake';

export interface EmailProviderMessage {
  id: string;
  threadId: string | null;
  from: string;
  to: string[];
  subject: string | null;
  snippet: string | null;
  body: string | null;
  receivedAt: Date | null;
  isRead: boolean;
}

export interface EmailProviderListOptions {
  maxResults?: number | undefined;
  pageToken?: string | undefined;
}

export interface EmailProviderListResult {
  messages: EmailProviderMessage[];
  nextPageToken?: string | undefined;
}

export interface EmailProviderPort {
  readonly providerId: EmailProviderId;
  listMessages(
    accountId: string,
    options?: EmailProviderListOptions,
  ): Promise<EmailProviderListResult>;
  getMessage(accountId: string, messageId: string): Promise<EmailProviderMessage | null>;
  healthCheck(): Promise<boolean>;
}
