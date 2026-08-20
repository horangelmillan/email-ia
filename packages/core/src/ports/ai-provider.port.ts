export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
}

export interface EmbeddingResult {
  vector: number[];
  model: string;
}

export interface ModelInfo {
  id: string;
}

export interface AIProviderPort {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(texts: string[]): Promise<EmbeddingResult[]>;
  listModels(): Promise<ModelInfo[]>;
  pullModel(name: string): Promise<void>;
}

export interface AIProviderConfig {
  baseUrl: string;
  apiKey?: string;
  model?: string;
}
