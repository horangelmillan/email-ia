# Runbook 02 — Migraciones de BD (Drizzle + libSQL)

## Objetivo

Evolucionar el esquema `contacts`/`emails` (`packages/db/src/schema/`) de forma versionada y aplicable en local, tests y Electron sin romper `DbError` ni `SecretStorePort`.

## Requisitos previos

- Drizzle Kit `0.31.10` (`drizzle.config.ts` raíz y `packages/db/drizzle.config.ts`).
- Esquema en `packages/db/src/schema/{contacts,emails}.ts` + `index.ts`.
- Cliente `createDb()`/`createInMemoryDb()` (`packages/db/src/client/connection.ts:42`) resuelve `DATABASE_URL`/`DATABASE_ENCRYPTION_KEY` o `SecretStorePort` (`email-ia/db-encryption-key`).
- Migración helper `migrate(db, folder)` (`packages/db/src/client/migrate.ts:6`) lee `*.sql` con `--> statement-breakpoint`.

## Procedimiento

1. Modificar esquema (`packages/db/src/schema/*.ts`) y exportar en `index.ts`.
2. Generar migración:
   ```bash
   pnpm --filter @email-ia/db exec drizzle-kit generate
   # o desde raíz:
   pnpm exec drizzle-kit generate --config=drizzle.config.ts
   ```
   Produce `packages/db/drizzle/<hash>_<nombre>.sql` + `meta/_journal.json`.
3. Revisar SQL: una sentencia por `--> statement-breakpoint`, indices/FKs explícitos.
4. Aplicar en local:
   ```ts
   import { createDb } from '@email-ia/db';
   import { migrate } from '@email-ia/db/client';
   const db = await createDb({ url: 'file:email-ia.db' });
   await migrate(db); // lee packages/db/drizzle por defecto
   ```
   O vía `drizzle-kit migrate` con `drizzle.config.ts`.
5. Verificar en tests (`:memory:`):
   ```bash
   pnpm test:coverage -- packages/db
   ```
   `createInMemoryDb()` + `migrate()` deben ser verdes.

## Validación

- `pnpm build` y `pnpm test:coverage` verdes (≥80 %).
- `packages/db/drizzle/meta/_journal.json` lista la nueva migración.
- `PRAGMA foreign_keys = ON` activo (`connection.ts:57`).

## Recuperación

- `migrate` lanza `DbError` (`Fallo al aplicar migración ...`): revisar SQL y `statement-breakpoint`, no hay rollback automático — restaurar backup `file:email-ia.db` o recrear desde última migración buena.
- Conflicto `better-sqlite3` en Windows: mantener `@libsql/client` (no requiere VS Build Tools); `better-sqlite3-multiple-ciphers` solo si hay toolchain nativa (cambio aislado en `connection.ts`).
- Clave de cifrado perdida (`SecretStorePort`): recuperar de `KeytarSecretStore`/`EnvSecretStore`; sin clave, la BD cifrada no es legible — restaurar backup desempaquetado o recrear BD.

## Referencias

- `ADR-002` §Persistencia, `ADR-004` (Drizzle + libSQL + `SecretStorePort` + `DbError`), `ARCHITECTURE_DECISIONS.md:3.6`.
