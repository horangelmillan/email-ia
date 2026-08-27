import { ProviderError } from '@email-ia/core';
import { OpenAICompatibleProvider, type FetchLike } from './openai-compatible-provider.js';

export interface OllamaProviderConfig {
  baseUrl: string;
  apiKey?: string;
  model?: string;
}

const OLLAMA_PULL_TIMEOUT_MS = 300_000;

function normalizeOllamaBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (!trimmed) throw new ProviderError('baseUrl es obligatoria');
  return trimmed.endsWith('/v1') ? trimmed.slice(0, -3).replace(/\/+$/, '') : trimmed;
}

export class OllamaProvider extends OpenAICompatibleProvider {
  private readonly ollamaBase: string;

  constructor(config: OllamaProviderConfig, fetchImpl: FetchLike = globalThis.fetch) {
    // OpenAI-compatible part uses /v1; ollama pull uses /api/pull without /v1
    const v1Base = config.baseUrl.replace(/\/+$/, '').endsWith('/v1')
      ? config.baseUrl.replace(/\/+$/, '')
      : `${config.baseUrl.replace(/\/+$/, '')}/v1`;
    super({ ...config, baseUrl: v1Base }, fetchImpl);
    this.ollamaBase = normalizeOllamaBase(config.baseUrl);
  }

  override async pullModel(name: string): Promise<void> {
    if (!name || !name.trim()) throw new ProviderError('pullModel: name es obligatorio');
    const fetchImpl: FetchLike = (this as unknown as { fetchImpl: FetchLike }).fetchImpl;
    // Prefer private field via bracket; fallback to global fetch
    const doFetch: FetchLike =
      (fetchImpl as FetchLike) ?? (globalThis.fetch as unknown as FetchLike);
    const url = new URL(`${this.ollamaBase}/api/pull`);
    const response = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(OLLAMA_PULL_TIMEOUT_MS),
    });
    if (!response.ok) throw new ProviderError(`pullModel HTTP ${response.status}`, response.status);
    // Ollama streams NDJSON; draining ensures completion. Accept empty or JSON.
    try {
      const text = await response.text();
      if (text) {
        // validate last line not error
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line) as { error?: string; status?: string };
            if (obj.error) throw new ProviderError(`pullModel: ${obj.error}`);
          } catch (e) {
            if (e instanceof ProviderError) throw e;
            // ignore non-JSON lines
          }
        }
      }
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      // if text() fails, ignore (server closed)
    }
  }
}
