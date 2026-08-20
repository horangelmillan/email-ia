import { SHARED_PACKAGE } from '@email-ia/shared';

export const DB_PACKAGE = '@email-ia/db' as const;

export function dbName(): string {
  return `${DB_PACKAGE} depends on ${SHARED_PACKAGE}`;
}
