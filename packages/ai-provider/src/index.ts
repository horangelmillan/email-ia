import type { AIProviderConfig, AIProviderPort } from '@email-ia/core';
import { OpenAICompatibleProvider, type FetchLike } from './openai-compatible-provider.js';

export function createAIProvider(config: AIProviderConfig, fetchImpl?: FetchLike): AIProviderPort {
  return new OpenAICompatibleProvider(config, fetchImpl);
}

export { OpenAICompatibleProvider } from './openai-compatible-provider.js';
export { ProviderError } from '@email-ia/core';
export type {
  AIProviderConfig,
  AIProviderPort,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatRole,
  EmbeddingResult,
  ModelInfo,
} from '@email-ia/core';
export type { FetchLike } from './openai-compatible-provider.js';
