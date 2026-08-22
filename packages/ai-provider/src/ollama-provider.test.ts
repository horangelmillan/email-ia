import { describe, expect, it, vi } from 'vitest';
import { OllamaProvider } from './ollama-provider.js';
import { ProviderError } from '@email-ia/core';
import type { FetchLike } from './openai-compatible-provider.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
function textResponse(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/plain' } });
}

describe('OllamaProvider', () => {
  it('pullModel hace POST a /api/pull sin /v1', async () => {
    const fetchImpl = vi.fn(async () =>
      textResponse('{"status":"pulling"}\n{"status":"success"}\n'),
    );
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434/v1' },
      fetchImpl as unknown as FetchLike,
    );
    await p.pullModel('llama3');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('http://localhost:11434/api/pull');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'llama3' });
  });

  it('pullModel normaliza baseUrl con y sin /v1', async () => {
    const fetchImpl = vi.fn(async () => textResponse(''));
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434' },
      fetchImpl as unknown as FetchLike,
    );
    await p.pullModel('m');
    expect((fetchImpl.mock.calls[0] as unknown as [URL])[0].toString()).toBe(
      'http://localhost:11434/api/pull',
    );
  });

  it('lanza ProviderError si name vacío', async () => {
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434' },
      (async () => new Response()) as unknown as FetchLike,
    );
    await expect(p.pullModel('')).rejects.toThrow(ProviderError);
  });

  it('lanza ProviderError en HTTP error', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'x' }, 500));
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434' },
      fetchImpl as unknown as FetchLike,
    );
    await expect(p.pullModel('m')).rejects.toThrow(ProviderError);
  });

  it('lanza ProviderError si stream contiene error', async () => {
    const fetchImpl = vi.fn(async () => textResponse('{"status":"ok"}\n{"error":"disk full"}\n'));
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434' },
      fetchImpl as unknown as FetchLike,
    );
    await expect(p.pullModel('m')).rejects.toThrow(ProviderError);
  });

  it('hereda chat/embed/listModels de OpenAICompatible', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ model: 'm', choices: [{ message: { content: 'hi' } }] }),
    );
    const p = new OllamaProvider(
      { baseUrl: 'http://localhost:11434' },
      fetchImpl as unknown as FetchLike,
    );
    const res = await p.chat([{ role: 'user', content: 'hola' }]);
    expect(res.content).toBe('hi');
  });
});
