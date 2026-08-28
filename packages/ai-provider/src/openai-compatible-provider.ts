import { ProviderError } from '@email-ia/core';
import type {
  AIProviderConfig,
  AIProviderPort,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbeddingResult,
  ModelInfo,
} from '@email-ia/core';

export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

const REQUEST_TIMEOUT_MS = 30_000;

function normalizeBaseUrl(baseUrl: string): string {
  let end = baseUrl.length;
  while (end > 0 && baseUrl[end - 1] === '/') end--;
  const base = baseUrl.slice(0, end);
  if (!base) {
    throw new ProviderError('baseUrl es obligatoria');
  }
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

interface ChatCompletionResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

interface EmbeddingResponse {
  model?: string;
  data?: Array<{ embedding?: number[] }>;
}

interface ModelsResponse {
  data?: Array<{ id?: string }>;
}

export class OpenAICompatibleProvider implements AIProviderPort {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly model: string | undefined;
  private readonly fetchImpl: FetchLike;

  constructor(config: AIProviderConfig, fetchImpl: FetchLike = globalThis.fetch) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.fetchImpl = fetchImpl;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const body: Record<string, unknown> = { model: this.model, messages };
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }
    const data = await this.request<ChatCompletionResponse>('/chat/completions', body);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ProviderError('chat: la respuesta no contiene contenido');
    }
    return { content, model: data.model ?? this.model ?? 'unknown' };
  }

  async embed(texts: string[]): Promise<EmbeddingResult[]> {
    const data = await this.request<EmbeddingResponse>('/embeddings', {
      model: this.model,
      input: texts,
    });
    if (!data.data) {
      throw new ProviderError('embed: la respuesta no contiene datos');
    }
    return data.data.map((item) => ({
      vector: item.embedding ?? [],
      model: data.model ?? this.model ?? 'unknown',
    }));
  }

  async listModels(): Promise<ModelInfo[]> {
    const data = await this.request<ModelsResponse>('/models', undefined, 'GET');
    return (data.data ?? [])
      .filter((item) => item.id !== undefined)
      .map((item) => ({ id: item.id as string }));
  }

  async pullModel(_name: string): Promise<void> {
    throw new ProviderError('pullModel no está soportado por proveedores OpenAI-compatible');
  }

  private async request<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    const response = await this.fetchImpl(new URL(`${this.baseUrl}${path}`), {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new ProviderError(`HTTP ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  }
}
