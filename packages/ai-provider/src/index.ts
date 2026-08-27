export { OpenAICompatibleProvider, type FetchLike } from './openai-compatible-provider.js';
export { OllamaProvider } from './ollama-provider.js';
export { FilesystemModelManager } from './filesystem-model-manager.js';
export { LlamafileRuntime } from './llamafile-runtime.js';
export {
  createAIProvider,
  DEFAULT_BASE_URL,
  resolveBaseUrl,
  type AIProviderKind,
  type CreateAIProviderOptions,
  type FactoryDeps,
} from './factory.js';
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
  LocalModelInfo,
  ModelManagerPort,
  PullProgress,
  PullProgressCallback,
} from '@email-ia/core';
