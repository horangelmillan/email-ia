import { describe, expect, it } from 'vitest';
import type { EmailProviderMessage } from '@email-ia/core';
import { FakeEmailProvider } from './fake-email-provider.js';

function msg(id: string, subject = `subj ${id}`): EmailProviderMessage {
  return {
    id,
    threadId: null,
    from: 'a@example.com',
    to: ['b@example.com'],
    subject,
    snippet: 'snip',
    body: 'body',
    receivedAt: new Date('2026-01-01T00:00:00Z'),
    isRead: false,
  };
}

describe('FakeEmailProvider', () => {
  it('providerId es fake y healthCheck ok', async () => {
    const p = new FakeEmailProvider();
    expect(p.providerId).toBe('fake');
    await expect(p.healthCheck()).resolves.toBe(true);
  });

  it('listMessages con paginación', async () => {
    const p = new FakeEmailProvider({ acc1: [msg('1'), msg('2'), msg('3')] });
    const r1 = await p.listMessages('acc1', { maxResults: 2 });
    expect(r1.messages).toHaveLength(2);
    expect(r1.nextPageToken).toBe('2');
    const r2 = await p.listMessages('acc1', { maxResults: 2, pageToken: r1.nextPageToken });
    expect(r2.messages).toHaveLength(1);
    expect(r2.nextPageToken).toBeUndefined();
  });

  it('pageToken inválido vuelve a 0 y lista completa sin opciones', async () => {
    const p = new FakeEmailProvider({ acc1: [msg('1'), msg('2')] });
    const r = await p.listMessages('acc1', { pageToken: 'bad' });
    expect(r.messages).toHaveLength(2);
    const r2 = await p.listMessages('acc1');
    expect(r2.messages).toHaveLength(2);
    const empty = await p.listMessages('unknown');
    expect(empty.messages).toHaveLength(0);
  });

  it('getMessage retorna null si no existe', async () => {
    const p = new FakeEmailProvider({ acc1: [msg('1')] });
    expect(await p.getMessage('acc1', '1')).not.toBeNull();
    expect(await p.getMessage('acc1', '99')).toBeNull();
    expect(await p.getMessage('unknown', '1')).toBeNull();
  });

  it('seed reemplaza store', async () => {
    const p = new FakeEmailProvider();
    p.seed('acc1', [msg('a')]);
    expect((await p.listMessages('acc1')).messages).toHaveLength(1);
    p.seed('acc1', [msg('b'), msg('c')]);
    expect((await p.listMessages('acc1')).messages).toHaveLength(2);
  });
});
