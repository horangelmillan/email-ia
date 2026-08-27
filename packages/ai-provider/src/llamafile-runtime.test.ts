import { describe, expect, it, vi } from 'vitest';
import { LlamafileRuntime } from './llamafile-runtime.js';
import { ProviderError } from '@email-ia/core';

describe('LlamafileRuntime', () => {
  it('getServerUrl construye url', () => {
    const rt = new LlamafileRuntime({
      binaryPath: '/bin/llamafile',
      modelPath: '/models/m.gguf',
      port: 9090,
    });
    expect(rt.getServerUrl()).toBe('http://127.0.0.1:9090/v1');
  });

  it('lanza si faltan paths', () => {
    expect(() => new LlamafileRuntime({ binaryPath: '', modelPath: '/m' } as never)).toThrow(
      ProviderError,
    );
  });

  it('isBinaryAvailable false si falta binario', () => {
    const rt = new LlamafileRuntime(
      { binaryPath: '/bin/a', modelPath: '/m.gguf' },
      {
        fsImpl: { existsSync: () => false },
        fetchImpl: async () => new Response(null, { status: 200 }),
      },
    );
    expect(rt.isBinaryAvailable()).toBe(false);
  });

  it('healthCheck true cuando /v1/models ok', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const rt = new LlamafileRuntime(
      { binaryPath: '/bin/a', modelPath: '/m.gguf' },
      { fsImpl: { existsSync: () => true }, fetchImpl: fetchImpl as unknown as typeof fetch },
    );
    expect(await rt.healthCheck()).toBe(true);
  });

  it('start lanza si binario no disponible', async () => {
    const rt = new LlamafileRuntime(
      { binaryPath: '/bin/a', modelPath: '/m.gguf' },
      {
        fsImpl: { existsSync: () => false },
        fetchImpl: async () => new Response(null, { status: 500 }),
      },
    );
    await expect(rt.start()).rejects.toThrow(ProviderError);
  });

  it('start spawnea binario y marca running', async () => {
    const spawnImpl = vi.fn(() => ({ pid: 123, on: vi.fn(), kill: vi.fn(), unref: vi.fn() }));
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const rt = new LlamafileRuntime(
      { binaryPath: '/bin/a', modelPath: '/m.gguf', port: 8080 },
      {
        fsImpl: { existsSync: () => true },
        fetchImpl: fetchImpl as unknown as typeof fetch,
        spawnImpl: spawnImpl as unknown as typeof spawnImpl,
      },
    );
    await rt.start();
    expect(spawnImpl).toHaveBeenCalled();
    expect(rt.isRunning()).toBe(true);
    await rt.stop();
    expect(rt.isRunning()).toBe(false);
  });

  it('stop no falla si no está running', async () => {
    const rt = new LlamafileRuntime(
      { binaryPath: '/bin/a', modelPath: '/m.gguf' },
      { fsImpl: { existsSync: () => true } },
    );
    await expect(rt.stop()).resolves.toBeUndefined();
  });
});
