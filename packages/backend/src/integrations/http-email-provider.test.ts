import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@email-ia/core';
import { HttpEmailProvider } from './http-email-provider.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HttpEmailProvider', () => {
  it('lanza si baseUrl vacía o providerId faltante', () => {
    expect(() => new HttpEmailProvider({ providerId: 'gmail', baseUrl: '' } as never)).toThrow(
      IntegrationError,
    );
    expect(() => new HttpEmailProvider({ providerId: '' as never, baseUrl: 'http://x' })).toThrow(
      IntegrationError,
    );
  });

  it('normaliza baseUrl con trailing slash', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ messages: [] }));
    const p = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x/' },
      fetchImpl as unknown as typeof fetch,
    );
    await p.listMessages('acc1');
    expect(fetchImpl).toHaveBeenCalled();
    const firstCall = fetchImpl.mock.calls[0] as unknown as [URL];
    const url = String(firstCall[0].toString());
    expect(url).toContain('http://x/messages');
  });

  it('listMessages mapea mensajes y nextPageToken', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        messages: [
          {
            id: '1',
            threadId: null,
            from: 'a@x',
            to: ['b@x'],
            subject: 'hi',
            snippet: 's',
            body: 'b',
            receivedAt: '2026-01-01T00:00:00Z',
            isRead: false,
          },
        ],
        nextPageToken: 'tok',
      }),
    );
    const p = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetchImpl as unknown as typeof fetch,
    );
    const r = await p.listMessages('acc1', { maxResults: 1, pageToken: '0' });
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]?.id).toBe('1');
    expect(r.messages[0]?.receivedAt instanceof Date).toBe(true);
    expect(r.nextPageToken).toBe('tok');
  });

  it('listMessages sin nextPageToken y con messages no array', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ messages: null }));
    const p = new HttpEmailProvider(
      { providerId: 'outlook', baseUrl: 'http://x' },
      fetchImpl as unknown as typeof fetch,
    );
    const r = await p.listMessages('acc1');
    expect(r.messages).toHaveLength(0);
    expect(r.nextPageToken).toBeUndefined();
  });

  it('listMessages lanza IntegrationError si HTTP no ok', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'x' }, 500));
    const p = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetchImpl as unknown as typeof fetch,
    );
    await expect(p.listMessages('acc1')).rejects.toBeInstanceOf(IntegrationError);
  });

  it('getMessage retorna null en 404 y lanza en 500', async () => {
    const fetch404 = vi.fn(async () => jsonResponse({}, 404));
    const p404 = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetch404 as unknown as typeof fetch,
    );
    await expect(p404.getMessage('acc1', 'missing')).resolves.toBeNull();

    const fetch500 = vi.fn(async () => jsonResponse({}, 500));
    const p500 = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetch500 as unknown as typeof fetch,
    );
    await expect(p500.getMessage('acc1', '1')).rejects.toBeInstanceOf(IntegrationError);
  });

  it('getMessage retorna null si id faltante y normaliza campos nulos', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ from: 'a', to: null, isRead: 1 }));
    const p = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetchImpl as unknown as typeof fetch,
    );
    await expect(p.getMessage('acc1', '1')).resolves.toBeNull();

    const fetchImpl2 = vi.fn(async () =>
      jsonResponse({
        id: '2',
        threadId: null,
        from: 'a',
        to: ['b'],
        subject: null,
        snippet: null,
        body: null,
        receivedAt: null,
        isRead: false,
      }),
    );
    const p2 = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      fetchImpl2 as unknown as typeof fetch,
    );
    const m = await p2.getMessage('acc1', '2');
    expect(m?.subject).toBeNull();
    expect(m?.receivedAt).toBeNull();
  });

  it('healthCheck true si ok, false si no ok o error', async () => {
    const ok = vi.fn(async () => new Response(null, { status: 200 }));
    const pOk = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      ok as unknown as typeof fetch,
    );
    await expect(pOk.healthCheck()).resolves.toBe(true);

    const notOk = vi.fn(async () => new Response(null, { status: 500 }));
    const pNot = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      notOk as unknown as typeof fetch,
    );
    await expect(pNot.healthCheck()).resolves.toBe(false);

    const err = vi.fn(async () => {
      throw new Error('net');
    });
    const pErr = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x' },
      err as unknown as typeof fetch,
    );
    await expect(pErr.healthCheck()).resolves.toBe(false);
  });
});
