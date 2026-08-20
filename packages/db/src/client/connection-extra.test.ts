import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDb } from './connection.js';
import { EnvSecretStore } from '../secret-store/env-secret-store.js';

describe('createDb env fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('usa DATABASE_URL cuando no se pasa url', async () => {
    process.env.DATABASE_URL = ':memory:';
    const db = await createDb({});
    const res = await db.$client.execute('select 1 as v');
    expect(res.rows[0]).toMatchObject({ v: 1 });
  });

  it('usa DATABASE_ENCRYPTION_KEY', async () => {
    process.env.DATABASE_ENCRYPTION_KEY = 'env-key';
    const db = await createDb({ url: ':memory:' });
    expect(db).toBeDefined();
  });

  it('ignora error de SecretStore y continua sin clave', async () => {
    const failingStore: EnvSecretStore = {
      getPassword: async () => {
        throw new Error('store fail');
      },
      setPassword: async () => {},
      deletePassword: async () => false,
    } as unknown as EnvSecretStore;
    const db = await createDb({ url: ':memory:', secretStore: failingStore });
    expect(db).toBeDefined();
  });
});
