import { describe, expect, it, vi } from 'vitest';
import { FilesystemModelManager } from './filesystem-model-manager.js';
import { ProviderError } from '@email-ia/core';

function makeFs(overrides: Record<string, unknown> = {}) {
  return {
    existsSync: vi.fn(() => true),
    readdirSync: vi.fn(() => ['a.gguf', 'b.gguf']),
    statSync: vi.fn(() => ({ size: 100, isFile: () => true })),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn(() => ({
      write: vi.fn(),
      close: (cb: () => void) => cb(),
      on: vi.fn(),
    })),
    ...overrides,
  } as unknown as NonNullable<ConstructorParameters<typeof FilesystemModelManager>[0]['fsImpl']>;
}

describe('FilesystemModelManager', () => {
  it('listLocalModels lista ficheros', async () => {
    const fs = makeFs();
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    const list = await mgr.listLocalModels();
    expect(list).toHaveLength(2);
    expect(list[0]!.id).toBe('a.gguf');
  });

  it('getModelPath resuelve existente', async () => {
    const fs = makeFs({ existsSync: () => true } as never);
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    expect(await mgr.getModelPath('a.gguf')).toBe('/models/a.gguf');
  });

  it('removeModel borra fichero', async () => {
    const fs = makeFs() as unknown as { unlinkSync: ReturnType<typeof vi.fn> };
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    await mgr.removeModel('a.gguf');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('pullModel lanza si name no es URL', async () => {
    const fs = makeFs();
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs,
      fetchImpl: async () => new Response(null, { status: 200 }),
    });
    await expect(mgr.pullModel('llama-3')).rejects.toThrow(ProviderError);
  });

  it('pullModel descarga URL con streaming mock', async () => {
    const fs = makeFs({
      statSync: vi.fn(() => ({ size: 11, isFile: () => true })) as never,
    } as never);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello world'));
        controller.close();
      },
    });
    const fetchImpl = vi.fn(
      async () => new Response(body, { status: 200, headers: { 'content-length': '11' } }),
    );
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    const onProgress = vi.fn();
    const info = await mgr.pullModel('https://example.com/model.gguf', onProgress);
    expect(info.id).toBe('model.gguf');
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('pullModel lanza en HTTP error', async () => {
    const fs = makeFs();
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(mgr.pullModel('https://example.com/x.gguf')).rejects.toThrow(ProviderError);
  });

  it('listLocalModels retorna [] si readdir falla', async () => {
    const fs = makeFs({
      readdirSync: () => {
        throw new Error('no dir');
      },
    } as never);
    const mgr = new FilesystemModelManager({ modelsDir: '/models', fsImpl: fs as never });
    expect(await mgr.listLocalModels()).toEqual([]);
  });

  it('getModelPath retorna null si no existe', async () => {
    const fs = makeFs({ existsSync: () => false } as never);
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    expect(await mgr.getModelPath('nope.gguf')).toBeNull();
  });

  it('removeModel lanza si no existe', async () => {
    const fs = makeFs({ existsSync: () => false } as never);
    const mgr = new FilesystemModelManager({ modelsDir: '/models', fsImpl: fs as never });
    await expect(mgr.removeModel('missing.gguf')).rejects.toThrow(ProviderError);
  });

  it('pullModel fallback buffer cuando no hay getReader', async () => {
    const fs = makeFs({
      writeFileSync: vi.fn(),
      statSync: vi.fn(() => {
        throw new Error('no stat');
      }),
    } as never);
    // Response with body that has no getReader (fallback path)
    const mockBody = {} as unknown as ReadableStream;
    const response = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: mockBody,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as unknown as Response;
    const fetchImpl = vi.fn(async () => response);
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    const info = await mgr.pullModel('https://example.com/fallback.gguf');
    expect(info.id).toBe('fallback.gguf');
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('pullModel lanza cuando body es null', async () => {
    const fs = makeFs();
    const response = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: null,
    } as unknown as Response;
    const fetchImpl = vi.fn(async () => response);
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(mgr.pullModel('https://example.com/x.gguf')).rejects.toThrow(ProviderError);
  });

  it('listLocalModels ignora entradas no-fichero', async () => {
    const fs = makeFs({
      readdirSync: vi.fn(() => ['a.gguf', 'dir']) as never,
      statSync: vi.fn((p: string) =>
        p.endsWith('dir') ? { size: 0, isFile: () => false } : { size: 10, isFile: () => true },
      ) as never,
    } as never);
    const mgr = new FilesystemModelManager({
      modelsDir: '/models',
      fsImpl: fs as never,
      pathImpl: {
        join: (...a: string[]) => a.join('/'),
        basename: (p: string) => p.split('/').pop()!,
      },
    });
    const list = await mgr.listLocalModels();
    expect(list).toHaveLength(1);
  });
});
