import { describe, expect, it, vi } from 'vitest';
import { backendName, BACKEND_PACKAGE, makeProvider } from './index.js';

describe('backend', () => {
  it('exposes the package name', () => {
    expect(backendName()).toContain(BACKEND_PACKAGE);
  });

  it('resolves workspace dependencies', () => {
    expect(backendName()).toContain('@email-ia/core');
    expect(backendName()).toContain('@email-ia/db');
    expect(backendName()).toContain('AI provider');
    expect(backendName()).toContain('@email-ia/shared');
  });

  it('makeProvider devuelve un provider con baseUrl válida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: [{ id: 'm1' }] }), { status: 200 })),
    );
    try {
      const provider = makeProvider('http://localhost:1234');
      expect(provider).toBeDefined();
      expect(await provider!.listModels()).toEqual([{ id: 'm1' }]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('makeProvider devuelve undefined con baseUrl vacía', () => {
    expect(makeProvider('')).toBeUndefined();
  });

  it('makeProvider propaga errores no ProviderError', async () => {
    const mod = await import('@email-ia/ai-provider');
    const spy = vi.spyOn(mod, 'createAIProvider').mockImplementation(() => {
      throw new Error('generic');
    });
    try {
      expect(() => makeProvider('http://example.com')).toThrow('generic');
    } finally {
      spy.mockRestore();
    }
  });
});
