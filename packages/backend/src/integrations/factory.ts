import type { EmailProviderId, EmailProviderPort } from '@email-ia/core';
import { IntegrationError } from '@email-ia/core';
import { FakeEmailProvider } from './fake-email-provider.js';
import { HttpEmailProvider, type FetchLike, type TokenProvider } from './http-email-provider.js';

export interface CreateEmailProviderConfig {
  provider: EmailProviderId;
  baseUrl?: string;
  initialData?: Record<string, import('@email-ia/core').EmailProviderMessage[]>;
  tokenProvider?: TokenProvider | undefined;
}

const DEFAULT_BASE_URLS: Record<Exclude<EmailProviderId, 'fake'>, string> = {
  gmail: 'https://gmail.googleapis.com',
  outlook: 'https://graph.microsoft.com/v1.0',
  imap: 'http://localhost:1143',
};

export function createEmailProvider(
  config: CreateEmailProviderConfig,
  fetchImpl: FetchLike = globalThis.fetch,
): EmailProviderPort {
  if (!config.provider) throw new IntegrationError('provider es obligatorio', 400);

  if (config.provider === 'fake') {
    return new FakeEmailProvider(config.initialData);
  }

  const baseUrl =
    config.baseUrl ?? DEFAULT_BASE_URLS[config.provider as Exclude<EmailProviderId, 'fake'>];
  if (!baseUrl) throw new IntegrationError(`baseUrl requerido para ${config.provider}`, 400);

  return new HttpEmailProvider(
    { providerId: config.provider, baseUrl, tokenProvider: config.tokenProvider },
    fetchImpl,
  );
}
