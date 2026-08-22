import { describe, expect, it } from 'vitest';
import { createSecretStore } from './index.js';
import { EnvSecretStore } from './env-secret-store.js';

describe('createSecretStore', () => {
  it('retorna EnvSecretStore cuando keytar no está disponible', async () => {
    const store = await createSecretStore();
    expect(store).toBeInstanceOf(EnvSecretStore);
    await store.setPassword('svc', 'acct', 'pw');
    await expect(store.getPassword('svc', 'acct')).resolves.toBe('pw');
  });
});
