import { describe, expect, it, vi } from 'vitest';
import type { EmailProviderMessage, EmailRepositoryPort } from '@email-ia/core';
import { FakeEmailProvider } from '../integrations/fake-email-provider.js';
import { syncAccount } from './email-sync.service.js';

function makeRepo(): EmailRepositoryPort & { all: Map<string, unknown> } {
  const map = new Map<
    string,
    {
      id: string;
      accountId: string;
      fromAddress: string;
      toAddress: string;
      subject: string | null;
      snippet: string | null;
      body: string | null;
      isRead: boolean;
      threadId: string | null;
      receivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  const repo: EmailRepositoryPort = {
    findById: async (id) => (map.get(id) as never) ?? null,
    findAll: async () => [...map.values()] as never,
    create: async (input) => {
      const e = {
        id: input.id ?? `id-${map.size + 1}`,
        accountId: input.accountId,
        threadId: input.threadId ?? null,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        subject: input.subject ?? null,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
        isRead: input.isRead ?? false,
        receivedAt: input.receivedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      map.set(e.id, e);
      return e as never;
    },
    update: async (id, inp) => {
      const cur = map.get(id);
      if (!cur) return null as never;
      const next = { ...cur, ...inp, updatedAt: new Date() };
      map.set(id, next);
      return next as never;
    },
    delete: async (id) => map.delete(id),
  };
  return Object.assign(repo, { all: map });
}

const MSG: EmailProviderMessage = {
  id: 'm1',
  threadId: null,
  from: 'a@x',
  to: ['b@x'],
  subject: 'hi',
  snippet: 's',
  body: 'b',
  receivedAt: new Date('2026-01-01T00:00:00Z'),
  isRead: false,
};

describe('syncAccount incremental offline-first', () => {
  it('fetcha todas las páginas y upsertea en repo', async () => {
    const provider = new FakeEmailProvider({
      acc1: [MSG, { ...MSG, id: 'm2' }, { ...MSG, id: 'm3' }],
    });
    const repo = makeRepo();
    const res = await syncAccount('acc1', provider, repo, { maxResultsPerPage: 1 });
    expect(res.synced).toBe(3);
    expect(repo.all.size).toBe(3);
  });

  it('idempotente — re-sync no duplica y actualiza isRead', async () => {
    const provider = new FakeEmailProvider({ acc1: [MSG] });
    const repo = makeRepo();
    await syncAccount('acc1', provider, repo);
    expect(repo.all.size).toBe(1);
    // provider cambia isRead a true
    provider.seed('acc1', [{ ...MSG, isRead: true }]);
    await syncAccount('acc1', provider, repo);
    expect(repo.all.size).toBe(1);
    const stored = repo.all.get('m1') as { isRead: boolean };
    expect(stored.isRead).toBe(true);
  });

  it('lanza si accountId vacío', async () => {
    const provider = new FakeEmailProvider();
    const repo = makeRepo();
    await expect(syncAccount('', provider, repo)).rejects.toThrow();
  });

  it('sync con repositorio que falla en create propaga error', async () => {
    const provider = new FakeEmailProvider({ acc1: [MSG] });
    const repo = makeRepo();
    repo.create = vi.fn(async () => {
      throw new Error('db fail');
    }) as never;
    await expect(syncAccount('acc1', provider, repo)).rejects.toThrow('db fail');
  });
});
