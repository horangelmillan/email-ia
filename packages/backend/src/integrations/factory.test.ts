import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@email-ia/core';
import { createEmailProvider } from './factory.js';
import { FakeEmailProvider } from './fake-email-provider.js';
import { HttpEmailProvider } from './http-email-provider.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('factory createEmailProvider', () => {
  it('crea FakeEmailProvider', () => {
    const p = createEmailProvider({ provider: 'fake', initialData: { acc1: [] } });
    expect(p).toBeInstanceOf(FakeEmailProvider);
  });

  it('crea HttpEmailProvider gmail con baseUrl default', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ messages: [] }));
    const p = createEmailProvider({ provider: 'gmail' }, fetchImpl as unknown as typeof fetch);
    expect(p).toBeInstanceOf(HttpEmailProvider);
    expect(p.providerId).toBe('gmail');
    await p.listMessages('acc1');
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('crea outlook y imap con defaults', () => {
    const p1 = createEmailProvider({ provider: 'outlook' });
    const p2 = createEmailProvider({ provider: 'imap' });
    expect(p1.providerId).toBe('outlook');
    expect(p2.providerId).toBe('imap');
  });

  it('usa baseUrl custom cuando se provee', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ messages: [] }));
    const p = createEmailProvider(
      { provider: 'gmail', baseUrl: 'http://custom' },
      fetchImpl as unknown as typeof fetch,
    );
    await p.listMessages('acc1');
    const firstCall = fetchImpl.mock.calls[0] as unknown as [URL];
    const url = String(firstCall[0].toString());
    expect(url).toContain('http://custom');
  });

  it('lanza si provider faltante', () => {
    expect(() => createEmailProvider({ provider: '' as never })).toThrow(IntegrationError);
  });

  it('lanza si baseUrl vacío para http provider', () => {
    expect(() => createEmailProvider({ provider: 'gmail', baseUrl: '' })).toThrow(IntegrationError);
  });
});
