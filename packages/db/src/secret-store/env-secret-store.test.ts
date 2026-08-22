import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { EnvSecretStore } from './env-secret-store.js';

describe('EnvSecretStore', () => {
  let store: EnvSecretStore;
  const service = 'email-ia';
  const account = 'db-encryption-key';
  const envKey = 'EMAIL_IA__DB_ENCRYPTION_KEY';

  beforeEach(() => {
    store = new EnvSecretStore();
    delete process.env[envKey];
  });

  afterEach(() => {
    delete process.env[envKey];
  });

  it('almacena y recupera en memoria', async () => {
    await store.setPassword(service, account, 's3cr3t');
    await expect(store.getPassword(service, account)).resolves.toBe('s3cr3t');
  });

  it('retorna null cuando no existe', async () => {
    await expect(store.getPassword(service, account)).resolves.toBeNull();
  });

  it('borra correctamente', async () => {
    await store.setPassword(service, account, 'x');
    await expect(store.deletePassword(service, account)).resolves.toBe(true);
    await expect(store.getPassword(service, account)).resolves.toBeNull();
    await expect(store.deletePassword(service, account)).resolves.toBe(false);
  });

  it('prioriza process.env sobre memoria', async () => {
    process.env[envKey] = 'from-env';
    await store.setPassword(service, account, 'from-memory');
    await expect(store.getPassword(service, account)).resolves.toBe('from-env');
  });
});
