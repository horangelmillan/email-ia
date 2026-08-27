export const CORE_PACKAGE = '@email-ia/core' as const;

export function coreName(): string {
  return CORE_PACKAGE;
}

export type {
  AIProviderConfig,
  AIProviderPort,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatRole,
  EmbeddingResult,
  ModelInfo,
} from './ports/ai-provider.port.js';
export type {
  Contact,
  ContactRepositoryPort,
  CreateContactInput,
  UpdateContactInput,
} from './ports/contact.port.js';
export type {
  CreateEmailInput,
  Email,
  EmailFilter,
  EmailRepositoryPort,
  UpdateEmailInput,
} from './ports/email.port.js';
export type { SecretStorePort } from './ports/secret-store.port.js';
export type {
  LocalModelInfo,
  ModelManagerPort,
  PullProgress,
  PullProgressCallback,
} from './ports/model-manager.port.js';
export { AppError } from './errors/app-error.js';
export type { AppErrorOptions } from './errors/app-error.js';
export { DbError } from './errors/db-error.js';
export { ProviderError } from './errors/provider-error.js';
