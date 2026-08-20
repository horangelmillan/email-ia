import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './connection.js';
import { DbError } from '@email-ia/core';

export async function migrate(db: Db, migrationsFolder = 'packages/db/drizzle'): Promise<void> {
  const client = (db as unknown as { $client: { execute(s: string): Promise<unknown> } }).$client;

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      )
    `);
  } catch (error) {
    throw new DbError('No se pudo crear la tabla de migraciones', error);
  }

  let files: string[];
  try {
    files = readdirSync(migrationsFolder)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    return;
  }

  for (const file of files) {
    const sql = readFileSync(join(migrationsFolder, file), 'utf-8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (error) {
        throw new DbError(`Fallo al aplicar migración ${file}`, { file, error });
      }
    }
  }
}
