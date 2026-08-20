export type {
  AIProviderConfig,
  AIProviderPort,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatRole,
  EmbeddingResult,
  ModelInfo,
} from './types.js';
export { OpenAICompatibleProvider, ProviderError } from './openai-compatible-provider.js';
export type { FetchLike } from './openai-compatible-provider.js';

import type { AIProviderConfig, AIProviderPort } from './types.js';
import { OpenAICompatibleProvider, type FetchLike } from './openai-compatible-provider.js';

export function createAIProvider(config: AIProviderConfig, fetchImpl?: FetchLike): AIProviderPort {
  return new OpenAICompatibleProvider(config, fetchImpl);
}
