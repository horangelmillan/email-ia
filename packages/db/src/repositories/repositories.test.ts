import { describe, expect, it, beforeEach } from 'vitest';
import { createInMemoryDb } from '../client/connection.js';
import { migrate } from '../client/migrate.js';
import { DrizzleContactRepository } from './contact-repository.js';
import { DrizzleEmailRepository } from './email-repository.js';
import type { Db } from '../client/connection.js';

async function prepareDb(): Promise<Db> {
  const db = await createInMemoryDb();
  await migrate(db, 'packages/db/drizzle');
  // ensure clean state per test
  await db.$client.execute('DELETE FROM emails');
  await db.$client.execute('DELETE FROM contacts');
  return db;
}

describe('DrizzleContactRepository', () => {
  let db: Db;
  let repo: DrizzleContactRepository;

  beforeEach(async () => {
    db = await prepareDb();
    repo = new DrizzleContactRepository(db);
  });

  it('CRUD completo de contactos', async () => {
    const created = await repo.create({ email: 'a@test.com', displayName: 'Alice' });
    expect(created.email).toBe('a@test.com');
    expect(created.displayName).toBe('Alice');

    const byEmail = await repo.findByEmail('a@test.com');
    expect(byEmail?.id).toBe(created.id);

    const byId = await repo.findById(created.id);
    expect(byId?.email).toBe('a@test.com');

    const all = await repo.findAll();
    expect(all).toHaveLength(1);

    const updated = await repo.update(created.id, { displayName: 'Alice B' });
    expect(updated?.displayName).toBe('Alice B');

    const deleted = await repo.delete(created.id);
    expect(deleted).toBe(true);
    await expect(repo.findById(created.id)).resolves.toBeNull();
    await expect(repo.update(created.id, { displayName: 'x' })).resolves.toBeNull();
    await expect(repo.delete(created.id)).resolves.toBe(false);
  });
});

describe('DrizzleEmailRepository', () => {
  let db: Db;
  let repo: DrizzleEmailRepository;

  beforeEach(async () => {
    db = await prepareDb();
    repo = new DrizzleEmailRepository(db);
  });

  it('CRUD de emails con filtros', async () => {
    const e1 = await repo.create({
      accountId: 'acct-1',
      fromAddress: 'from@test.com',
      toAddress: 'to@test.com',
      subject: 'hola',
      body: 'cuerpo',
      isRead: false,
    });
    expect(e1.subject).toBe('hola');
    expect(e1.isRead).toBe(false);

    const e2 = await repo.create({
      accountId: 'acct-1',
      fromAddress: 'f2@test.com',
      toAddress: 'to@test.com',
      isRead: true,
    });

    await expect(repo.findById(e1.id)).resolves.toMatchObject({ id: e1.id });
    expect(await repo.findAll()).toHaveLength(2);
    expect(await repo.findAll({ accountId: 'acct-1' })).toHaveLength(2);
    expect(await repo.findAll({ isRead: false })).toHaveLength(1);
    expect(await repo.findAll({ isRead: true })).toHaveLength(1);

    const updated = await repo.update(e1.id, { isRead: true, subject: 'nuevo' });
    expect(updated?.isRead).toBe(true);
    expect(updated?.subject).toBe('nuevo');

    expect(await repo.delete(e1.id)).toBe(true);
    expect(await repo.delete(e2.id)).toBe(true);
    await expect(repo.findById(e1.id)).resolves.toBeNull();
    await expect(repo.update('missing', { subject: 'x' })).resolves.toBeNull();
    await expect(repo.delete('missing')).resolves.toBe(false);
  });
});
