import { createAIProvider, ProviderError } from '@email-ia/ai-provider';
import { coreName } from '@email-ia/core';
import { dbName } from '@email-ia/db';
import { SHARED_PACKAGE } from '@email-ia/shared';

export const BACKEND_PACKAGE = '@email-ia/backend' as const;

export function backendName(): string {
  return `${BACKEND_PACKAGE} integrates ${coreName()}, ${dbName()}, AI provider and ${SHARED_PACKAGE}`;
}

export { createApp } from './app.js';
export type { CreateAppOptions } from './app.js';
export { getHealth, getReadiness } from './health/health.js';
export type { HealthStatus, ReadinessStatus } from './health/health.js';
export { createLogger } from './observability/logger.js';
export type { LoggerConfig } from './observability/logger.js';
export { createOtelSdk } from './observability/otel.js';
export type { OtelConfig, OtelSdk } from './observability/otel.js';

export { FakeEmailProvider } from './integrations/fake-email-provider.js';
export { HttpEmailProvider } from './integrations/http-email-provider.js';
export type {
  FetchLike,
  HttpEmailProviderConfig,
  TokenProvider,
} from './integrations/http-email-provider.js';
export { createEmailProvider } from './integrations/factory.js';
export type { CreateEmailProviderConfig } from './integrations/factory.js';
export { syncAccount } from './sync/email-sync.service.js';
export type { SyncResult, SyncOptions } from './sync/email-sync.service.js';
export { createHandlers } from './integrations/mocks/handlers.js';
export { PromptService } from './prompts/prompt.service.js';
export { createRagRouter } from './rag/routes.js';
export { createPromptRouter } from './prompts/routes.js';
export type { MockMessage } from './integrations/mocks/handlers.js';

export function makeProvider(baseUrl: string) {
  try {
    return createAIProvider({ baseUrl });
  } catch (error) {
    if (error instanceof ProviderError) {
      return undefined;
    }
    throw error;
  }
}
