import { describe, expect, it, vi } from 'vitest';
import { createAIProvider, ProviderError } from './index.js';
import type { FetchLike } from './index.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function providerWith(fetchImpl: FetchLike) {
  return createAIProvider(
    { baseUrl: 'http://localhost:1234', apiKey: 'lm-studio', model: 'test-model' },
    fetchImpl,
  );
}

describe('OpenAICompatibleProvider', () => {
  it('envía el chat al endpoint correcto y devuelve el contenido', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ model: 'test-model', choices: [{ message: { content: 'hola' } }] }),
    );
    const provider = providerWith(fetchImpl as unknown as FetchLike);

    const result = await provider.chat([{ role: 'user', content: 'saluda' }], {
      temperature: 0.7,
      maxTokens: 128,
    });

    expect(result).toEqual({ content: 'hola', model: 'test-model' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('http://localhost:1234/v1/chat/completions');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.model).toBe('test-model');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(128);
  });

  it('normaliza la baseUrl aunque ya termine en /v1', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [{ id: 'a' }] }));
    const provider = createAIProvider(
      { baseUrl: 'http://localhost:1234/v1/' },
      fetchImpl as unknown as FetchLike,
    );

    await provider.listModels();

    const [url] = fetchImpl.mock.calls[0] as unknown as [URL];
    expect(url.toString()).toBe('http://localhost:1234/v1/models');
  });

  it('no envía apiKey cuando no se configura', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ choices: [{ message: { content: 'ok' } }] }),
    );
    const provider = createAIProvider(
      { baseUrl: 'http://localhost:1234' },
      fetchImpl as unknown as FetchLike,
    );

    await provider.chat([{ role: 'user', content: 'hola' }]);

    const [, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('genera embeddings para varios textos', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        model: 'embed-model',
        data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }],
      }),
    );
    const provider = providerWith(fetchImpl as unknown as FetchLike);

    const result = await provider.embed(['uno', 'dos']);

    expect(result).toEqual([
      { vector: [0.1, 0.2], model: 'embed-model' },
      { vector: [0.3, 0.4], model: 'embed-model' },
    ]);
  });

  it('lista los modelos disponibles', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [{ id: 'm1' }, { id: 'm2' }] }));
    const provider = providerWith(fetchImpl as unknown as FetchLike);

    const result = await provider.listModels();

    expect(result).toEqual([{ id: 'm1' }, { id: 'm2' }]);
  });

  it('lanza ProviderError ante un error HTTP', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'boom' }, 500));
    const provider = providerWith(fetchImpl as unknown as FetchLike);

    await expect(provider.chat([{ role: 'user', content: 'hola' }])).rejects.toThrow(ProviderError);
  });

  it('lanza ProviderError si la respuesta de chat no trae contenido', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [] }));
    const provider = providerWith(fetchImpl as unknown as FetchLike);

    await expect(provider.chat([{ role: 'user', content: 'hola' }])).rejects.toThrow(ProviderError);
  });

  it('rechaza una baseUrl vacía', () => {
    expect(() =>
      createAIProvider({ baseUrl: '' }, (async () => new Response()) as unknown as FetchLike),
    ).toThrow(ProviderError);
  });

  it('pullModel no está soportado en proveedores OpenAI-compatible', async () => {
    const provider = providerWith((async () => new Response()) as unknown as FetchLike);

    await expect(provider.pullModel('llama-3')).rejects.toThrow(ProviderError);
  });
});
