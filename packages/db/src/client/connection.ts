import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../schema/index.js';
import type { SecretStorePort } from '@email-ia/core';
import { DbError } from '@email-ia/core';

export type Db = LibSQLDatabase<typeof schema> & { $client: Client };

export interface DbConnectionOptions {
  url?: string;
  encryptionKey?: string;
  secretStore?: SecretStorePort;
  secretService?: string;
  secretAccount?: string;
}

const DEFAULT_SERVICE = 'email-ia';
const DEFAULT_ACCOUNT = 'db-encryption-key';

function resolveUrl(url: string | undefined): string {
  if (url) return url;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL as string;
  return 'file:email-ia.db';
}

async function resolveEncryptionKey(opts: DbConnectionOptions): Promise<string | undefined> {
  if (opts.encryptionKey) return opts.encryptionKey;
  if (process.env.DATABASE_ENCRYPTION_KEY) return process.env.DATABASE_ENCRYPTION_KEY;
  if (opts.secretStore) {
    const service = opts.secretService ?? DEFAULT_SERVICE;
    const account = opts.secretAccount ?? DEFAULT_ACCOUNT;
    try {
      const stored = await opts.secretStore.getPassword(service, account);
      if (stored) return stored;
    } catch {
      // ignore secret store errors; fall back to unencrypted
    }
  }
  return undefined;
}

export async function createDb(opts: DbConnectionOptions = {}): Promise<Db> {
  const url = resolveUrl(opts.url);
  const encryptionKey = await resolveEncryptionKey(opts);

  let client: Client;
  try {
    client = createClient(encryptionKey ? { url, encryptionKey } : { url });
  } catch (error) {
    throw new DbError('No se pudo crear el cliente de BD', error);
  }

  const db = drizzle(client, { schema }) as Db;

  // enable foreign keys & WAL where supported; libSQL ignores unsupported pragmas
  try {
    await client.execute('PRAGMA foreign_keys = ON');
  } catch {
    // ignore for :memory: or libSQL
  }

  return db;
}

export async function createInMemoryDb(): Promise<Db> {
  const client = createClient({ url: ':memory:' });
  const db = drizzle(client, { schema }) as Db;
  await client.execute('PRAGMA foreign_keys = ON');
  return db;
}
