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
export { AppError } from './errors/app-error.js';
export type { AppErrorOptions } from './errors/app-error.js';
export { ProviderError } from './errors/provider-error.js';
