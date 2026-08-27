import { describe, expect, it } from 'vitest';
import { KeytarSecretStore } from './keytar-secret-store.js';
import { EnvSecretStore } from './env-secret-store.js';

function makeFailingKeytar() {
  return {
    getPassword: async () => {
      throw new Error('keytar fail');
    },
    setPassword: async () => {
      throw new Error('keytar fail');
    },
    deletePassword: async () => {
      throw new Error('keytar fail');
    },
  };
}

function makeSuccessKeytar() {
  const mem = new Map<string, string>();
  return {
    getPassword: async (s: string, a: string) => mem.get(`${s}:${a}`) ?? null,
    setPassword: async (s: string, a: string, p: string) => {
      mem.set(`${s}:${a}`, p);
    },
    deletePassword: async (s: string, a: string) => mem.delete(`${s}:${a}`),
  };
}

describe('KeytarSecretStore', () => {
  it('usa fallback cuando keytar falla', async () => {
    const fallback = new EnvSecretStore();
    await fallback.setPassword('svc', 'acct', 'fallback-pw');
    const store = new KeytarSecretStore(makeFailingKeytar(), fallback);
    await expect(store.getPassword('svc', 'acct')).resolves.toBe('fallback-pw');
    await store.setPassword('svc2', 'acct2', 'new');
    await expect(fallback.getPassword('svc2', 'acct2')).resolves.toBe('new');
    await expect(store.deletePassword('svc', 'acct')).resolves.toBe(true);
  });

  it('prioriza keytar cuando funciona', async () => {
    const fallback = new EnvSecretStore();
    const keytar = makeSuccessKeytar();
    const store = new KeytarSecretStore(keytar, fallback);
    await store.setPassword('svc', 'acct', 'kpw');
    await expect(store.getPassword('svc', 'acct')).resolves.toBe('kpw');
    await expect(fallback.getPassword('svc', 'acct')).resolves.toBeNull();
    await expect(store.deletePassword('svc', 'acct')).resolves.toBe(true);
  });

  it('usa fallback cuando keytar retorna null o false', async () => {
    const fallback = new EnvSecretStore();
    await fallback.setPassword('svc', 'acct', 'fallback');
    const nullKeytar = {
      getPassword: async () => null,
      setPassword: async () => {},
      deletePassword: async () => false,
    };
    const store = new KeytarSecretStore(nullKeytar, fallback);
    await expect(store.getPassword('svc', 'acct')).resolves.toBe('fallback');
    await expect(store.deletePassword('svc', 'acct')).resolves.toBe(true);
    await expect(store.deletePassword('no', 'such')).resolves.toBe(false);
  });
});
