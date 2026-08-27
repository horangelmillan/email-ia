import { describe, expect, it } from 'vitest';
import { PactV3 } from '@pact-foundation/pact';
import path from 'node:path';
import { HttpEmailProvider } from '../http-email-provider.js';

describe('Pact consumer — EmailProviderPort over HTTP', () => {
  const provider = new PactV3({
    dir: path.resolve(process.cwd(), 'pacts'),
    consumer: 'email-ia-backend',
    provider: 'email-provider-api',
  });

  it('listMessages paginado — consumer contract', async () => {
    provider
      .given('messages exist for account acc1')
      .uponReceiving('a paginated listMessages request')
      .withRequest({
        method: 'GET',
        path: '/messages',
        query: { accountId: 'acc1', maxResults: '1' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
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
          nextPageToken: '1',
        },
      });

    await provider.executeTest(async (mockServer) => {
      const p = new HttpEmailProvider({
        providerId: 'gmail',
        baseUrl: mockServer.url,
      });
      const r = await p.listMessages('acc1', { maxResults: 1 });
      expect(r.messages).toHaveLength(1);
      expect(r.nextPageToken).toBe('1');
    });
  });

  it('getMessage found — consumer contract', async () => {
    provider
      .given('message 1 exists for account acc1')
      .uponReceiving('a getMessage request for existing id')
      .withRequest({
        method: 'GET',
        path: '/messages/1',
        query: { accountId: 'acc1' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: '1',
          threadId: null,
          from: 'a@x',
          to: ['b@x'],
          subject: 'hi',
          snippet: null,
          body: null,
          receivedAt: null,
          isRead: false,
        },
      });

    await provider.executeTest(async (mockServer) => {
      const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: mockServer.url });
      const m = await p.getMessage('acc1', '1');
      expect(m?.id).toBe('1');
    });
  });

  it('getMessage 404 mapped to null — consumer contract', async () => {
    provider
      .given('message 999 does not exist')
      .uponReceiving('a getMessage request for missing id')
      .withRequest({
        method: 'GET',
        path: '/messages/999',
        query: { accountId: 'acc1' },
      })
      .willRespondWith({ status: 404 });

    await provider.executeTest(async (mockServer) => {
      const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: mockServer.url });
      const m = await p.getMessage('acc1', '999');
      expect(m).toBeNull();
    });
  });

  it('healthCheck — consumer contract', async () => {
    provider
      .given('provider is healthy')
      .uponReceiving('a healthCheck request')
      .withRequest({ method: 'GET', path: '/health' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'ok' },
      });

    await provider.executeTest(async (mockServer) => {
      const p = new HttpEmailProvider({ providerId: 'gmail', baseUrl: mockServer.url });
      await expect(p.healthCheck()).resolves.toBe(true);
    });
  });
});
