import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpEmailProvider } from '../http-email-provider.js';
import { createHandlers, type MockMessage } from './handlers.js';

const MESSAGES: MockMessage[] = [
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
  {
    id: '2',
    threadId: 't1',
    from: 'c@x',
    to: ['d@x'],
    subject: 'hello',
    snippet: 's2',
    body: 'b2',
    receivedAt: null,
    isRead: true,
  },
];

const server = setupServer(...createHandlers('http://localhost:9999', MESSAGES));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MSW handlers + HttpEmailProvider contract', () => {
  it('listMessages via MSW respeta paginación', async () => {
    const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: 'http://localhost:9999' });
    const r1 = await p.listMessages('acc1', { maxResults: 1 });
    expect(r1.messages).toHaveLength(1);
    expect(r1.nextPageToken).toBe('1');
    const r2 = await p.listMessages('acc1', { maxResults: 1, pageToken: r1.nextPageToken });
    expect(r2.messages).toHaveLength(1);
    expect(r2.messages[0]?.id).toBe('2');
    expect(r2.nextPageToken).toBeUndefined();
  });

  it('getMessage via MSW retorna mensaje o null en 404', async () => {
    const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: 'http://localhost:9999' });
    const m = await p.getMessage('acc1', '1');
    expect(m?.id).toBe('1');
    const missing = await p.getMessage('acc1', '999');
    expect(missing).toBeNull();
  });

  it('healthCheck via MSW retorna true', async () => {
    const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: 'http://localhost:9999' });
    await expect(p.healthCheck()).resolves.toBe(true);
  });

  it('incluye Authorization cuando tokenProvider presente', async () => {
    let captured = '';
    const fetchCapture = async (_url: URL | string, init?: RequestInit) => {
      captured = (init?.headers as Record<string, string>)?.Authorization ?? '';
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const p = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x', tokenProvider: async () => 'tok123' },
      fetchCapture as unknown as typeof fetch,
    );
    await p.listMessages('acc1');
    expect(captured).toBe('Bearer tok123');

    // token null => no Authorization
    captured = '';
    const pNull = new HttpEmailProvider(
      { providerId: 'gmail', baseUrl: 'http://x', tokenProvider: async () => null },
      fetchCapture as unknown as typeof fetch,
    );
    await pNull.listMessages('acc1');
    expect(captured).toBe('');
  });
});
