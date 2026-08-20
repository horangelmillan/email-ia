import { SHARED_PACKAGE } from '@email-ia/shared';

export const DB_PACKAGE = '@email-ia/db' as const;

export function dbName(): string {
  return `${DB_PACKAGE} depends on ${SHARED_PACKAGE}`;
}

export * from './schema/index.js';
export * from './client/index.js';
export * from './repositories/index.js';
export * from './secret-store/env-secret-store.js';
