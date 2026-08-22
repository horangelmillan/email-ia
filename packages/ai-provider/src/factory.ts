import type { AIProviderConfig, AIProviderPort } from '@email-ia/core';
import { ProviderError } from '@email-ia/core';
import { OpenAICompatibleProvider, type FetchLike } from './openai-compatible-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { LlamafileRuntime } from './llamafile-runtime.js';

export type AIProviderKind = 'openai-compatible' | 'openai' | 'ollama' | 'lmstudio' | 'llamafile';

export interface CreateAIProviderOptions extends Omit<AIProviderConfig, 'baseUrl'> {
  baseUrl?: string | undefined;
  provider?: AIProviderKind | undefined;
  llamafile?:
    | {
        binaryPath: string;
        modelPath: string;
        host?: string | undefined;
        port?: number | undefined;
        args?: string[] | undefined;
      }
    | undefined;
}

export interface FactoryDeps {
  fetchImpl?: FetchLike | undefined;
  llamafileRuntime?: LlamafileRuntime | undefined;
}

const DEFAULT_BASE_URL: Record<AIProviderKind, string> = {
  'openai-compatible': 'http://localhost:1234',
  openai: 'https://api.openai.com',
  ollama: 'http://localhost:11434',
  lmstudio: 'http://localhost:1234',
  llamafile: 'http://localhost:8080',
};

function resolveBaseUrl(kind: AIProviderKind, explicit?: string): string {
  if (explicit === undefined) return DEFAULT_BASE_URL[kind];
  const trimmed = explicit.trim();
  if (!trimmed) return explicit;
  return trimmed;
}

export function createAIProvider(
  config: CreateAIProviderOptions,
  fetchImpl?: FetchLike,
  deps?: FactoryDeps,
): AIProviderPort {
  const kind: AIProviderKind = config.provider ?? 'openai-compatible';
  const baseUrl = resolveBaseUrl(kind, config.baseUrl);
  const fetchToUse = fetchImpl ?? deps?.fetchImpl;

  switch (kind) {
    case 'ollama':
      return new OllamaProvider({ ...config, baseUrl }, fetchToUse as FetchLike);
    case 'llamafile': {
      if (!config.llamafile)
        throw new ProviderError('llamafile config es obligatoria para provider llamafile');
      const runtime =
        deps?.llamafileRuntime ??
        new LlamafileRuntime(
          {
            binaryPath: config.llamafile.binaryPath,
            modelPath: config.llamafile.modelPath,
            ...(config.llamafile.host !== undefined ? { host: config.llamafile.host } : {}),
            ...(config.llamafile.port !== undefined ? { port: config.llamafile.port } : {}),
            ...(config.llamafile.args !== undefined ? { args: config.llamafile.args } : {}),
          },
          { fetchImpl: fetchToUse as FetchLike },
        );
      const serverUrl = runtime.getServerUrl();
      // Llamafile exposes OpenAI-compatible at /v1
      const delegate = new OpenAICompatibleProvider(
        { ...config, baseUrl: config.baseUrl?.trim() ? config.baseUrl : serverUrl },
        fetchToUse as FetchLike,
      );
      // Wrap to expose ensureRunning semantics while keeping AIProviderPort
      return {
        chat: delegate.chat.bind(delegate),
        embed: delegate.embed.bind(delegate),
        listModels: delegate.listModels.bind(delegate),
        pullModel: delegate.pullModel.bind(delegate),
        _llamafileRuntime: runtime,
      } as unknown as AIProviderPort;
    }
    case 'lmstudio':
    case 'openai':
    case 'openai-compatible':
    default:
      return new OpenAICompatibleProvider({ ...config, baseUrl }, fetchToUse as FetchLike);
  }
}

export { DEFAULT_BASE_URL, resolveBaseUrl };
