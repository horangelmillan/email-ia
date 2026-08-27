import { describe, expect, it, vi } from 'vitest';
import { createAIProvider, DEFAULT_BASE_URL } from './factory.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAICompatibleProvider } from './openai-compatible-provider.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('factory createAIProvider', () => {
  it('crea OpenAICompatible por defecto', () => {
    const p = createAIProvider({ baseUrl: 'http://x:1234' });
    expect(p).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it('crea OllamaProvider cuando provider=ollama', () => {
    const p = createAIProvider({ baseUrl: 'http://localhost:11434', provider: 'ollama' });
    expect(p).toBeInstanceOf(OllamaProvider);
  });

  it('usa baseUrl por defecto por kind cuando no se pasa', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    const p = createAIProvider(
      { provider: 'lmstudio' } as never,
      fetchImpl as unknown as typeof fetch,
    );
    expect((p as unknown as { baseUrl: string }).baseUrl).toContain(
      DEFAULT_BASE_URL.lmstudio.replace(/\/+$/, ''),
    );
    await p.listModels();
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('lanza si llamafile sin config', () => {
    expect(() => createAIProvider({ baseUrl: '', provider: 'llamafile' } as never)).toThrow();
  });

  it('crea llamafile con runtime inyectado', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ model: 'm', choices: [{ message: { content: 'hi' } }] }),
    );
    const fakeRuntime = {
      getServerUrl: () => 'http://127.0.0.1:8080/v1',
    } as unknown as import('./llamafile-runtime.js').LlamafileRuntime;
    const p = createAIProvider(
      {
        baseUrl: '',
        provider: 'llamafile',
        llamafile: { binaryPath: '/tmp/llamafile', modelPath: '/tmp/model.gguf' },
      },
      fetchImpl as unknown as typeof fetch,
      { llamafileRuntime: fakeRuntime },
    );
    const res = await p.chat([{ role: 'user', content: 'hola' }]);
    expect(res.content).toBe('hi');
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('crea provider openai y lmstudio sin error', () => {
    const f1 = createAIProvider({ baseUrl: 'https://api.openai.com/v1', provider: 'openai' });
    const f2 = createAIProvider({ provider: 'openai' } as never);
    expect(f1).toBeDefined();
    expect(f2).toBeDefined();
  });

  it('crea llamafile sin runtime inyectado (usa defaults)', () => {
    const p = createAIProvider({
      provider: 'llamafile',
      llamafile: { binaryPath: '/tmp/a', modelPath: '/tmp/b' },
    } as never);
    expect(p).toBeDefined();
  });
});
