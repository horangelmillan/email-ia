import { describe, expect, it } from 'vitest';
import { createInMemoryDb, createDb } from './connection.js';
import { migrate } from './migrate.js';
import { EnvSecretStore } from '../secret-store/env-secret-store.js';

describe('db client', () => {
  it('crea una BD en memoria operativa', async () => {
    const db = await createInMemoryDb();
    const result = await db.$client.execute('select 1 as v');
    expect(result.rows[0]).toMatchObject({ v: 1 });
  });

  it('createDb resuelve url y key desde SecretStore', async () => {
    const store = new EnvSecretStore();
    await store.setPassword('email-ia', 'db-encryption-key', 'test-key-123');
    const db = await createDb({ url: ':memory:', secretStore: store });
    const result = await db.$client.execute('select 1 as v');
    expect(result.rows[0]).toMatchObject({ v: 1 });
  });

  it('aplica migraciones iniciales', async () => {
    const db = await createInMemoryDb();
    await migrate(db, 'packages/db/drizzle');
    const tables = await db.$client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.rows.map((r) => (r as unknown as { name: string }).name);
    expect(names).toContain('contacts');
    expect(names).toContain('emails');
  });

  it('migrate no falla con carpeta inexistente', async () => {
    const db = await createInMemoryDb();
    await expect(migrate(db, 'no/such/dir')).resolves.toBeUndefined();
  });
});
