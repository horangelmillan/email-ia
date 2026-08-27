import { describe, expect, it, vi } from 'vitest';
import { createOtelSdk } from './otel.js';

describe('createOtelSdk', () => {
  it('returns null when disabled (privacy-first default)', () => {
    expect(
      createOtelSdk({ enabled: false, serviceName: 'email-ia', endpoint: 'http://localhost:4318' }),
    ).toBeNull();
  });

  it('creates sdk when enabled', async () => {
    const start = vi.fn(async () => {});
    const shutdown = vi.fn(async () => {});
    const FakeSdk = vi.fn(function (this: unknown, _opts: unknown) {
      return { start, shutdown };
    }) as unknown as typeof import('@opentelemetry/sdk-node').NodeSDK;
    const exporterFactory = vi.fn(() => ({}) as never);

    const sdk = createOtelSdk(
      { enabled: true, serviceName: 'email-ia', endpoint: 'http://localhost:4318' },
      { NodeSdkCtor: FakeSdk, exporterFactory },
    );
    expect(sdk).not.toBeNull();
    expect(FakeSdk).toHaveBeenCalledOnce();
    expect(exporterFactory).toHaveBeenCalledWith('http://localhost:4318');
    await sdk!.start();
    expect(start).toHaveBeenCalledOnce();
    await sdk!.shutdown();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it('passes service name as resource attribute', () => {
    const FakeSdk = vi.fn(function (this: unknown, opts: { resource: unknown }) {
      return { start: async () => {}, shutdown: async () => {}, _opts: opts };
    }) as unknown as typeof import('@opentelemetry/sdk-node').NodeSDK;
    const resourceFactory = vi.fn(
      (attrs: unknown) => attrs as never,
    ) as unknown as typeof import('@opentelemetry/resources').resourceFromAttributes;

    createOtelSdk(
      { enabled: true, serviceName: 'my-service', endpoint: 'http://localhost:4318' },
      { NodeSdkCtor: FakeSdk, resourceFactory, exporterFactory: () => ({}) as never },
    );
    expect(resourceFactory).toHaveBeenCalledWith(
      expect.objectContaining({ 'service.name': 'my-service' }),
    );
  });
});
