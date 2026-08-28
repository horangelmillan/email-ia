# Runbook 05 — Recuperación y copias de seguridad

## Objetivo

Restaurar el servicio local (BD, clave de cifrado, modelos, health) tras fallos, corrupción o pérdida de clave, con mínima pérdida de datos.

## Requisitos previos

- BD libSQL `file:email-ia.db` (o `:memory:` en tests) + `createDb`/`createInMemoryDb` (`packages/db/src/client/connection.ts:42`).
- Clave en `SecretStorePort` (`KeytarSecretStore` con fallback `EnvSecretStore`, `email-ia/db-encryption-key`, `packages/db/src/secret-store/`).
- Observabilidad: `getHealth()`/`getReadiness(checks)` (`packages/backend/src/health/health.ts:14`), `createApp({logger, readinessChecks, setup})` con `GET /health` 200 y `GET /ready` 200/503 (`packages/backend/src/app.ts:30`).
- Env `parseEnv`/`loadEnv` (`packages/shared/src/config/env.ts`) con `OTEL_ENABLED false` por defecto (privacy-first).

## Procedimiento

### Backup

1. Cerrar app/Electron para liberar `file:email-ia.db`.
2. Copiar BD y, si aplica, `models/`:
   ```bash
   cp email-ia.db email-ia.db.bak-$(date +%Y%m%d)
   # opcional con clave cifrada: exportar DATABASE_ENCRYPTION_KEY aparte (no en repo)
   ```
   Clave: `SecretStorePort.getPassword('email-ia','db-encryption-key')` o `DATABASE_ENCRYPTION_KEY` env (no commitear).
3. Verificar backup:
   ```bash
   sqlite3 email-ia.db.bak "PRAGMA integrity_check; SELECT count(*) FROM emails;"
   ```

### Restore

1. Restaurar BD:
   ```bash
   cp email-ia.db.bak email-ia.db
   ```
2. Restaurar clave (si falta):
   ```bash
   # Windows Credential Manager / macOS Keychain / Linux Secret Service vía keytar
   # o temporal:
   export DATABASE_ENCRYPTION_KEY="<clave>"
   ```
3. Re-aplicar migraciones si backup es antiguo:
   ```ts
   const db = await createDb({ url: 'file:email-ia.db' });
   await migrate(db);
   ```
4. Resincronizar correos (incremental, idempotente):
   ```ts
   await syncAccount(accountId, provider, repo);
   ```
5. Validar health:
   ```bash
   curl http://localhost:3000/health  # {status:"ok", uptime}
   curl http://localhost:3000/ready   # 200 ok | 503 si checks error
   ```

## Validación

- `GET /health` 200 y `GET /ready` según `getReadiness` (`health.test.ts:100%`).
- `pnpm test:coverage` verde tras restore (repositorios leen BD restaurada).
- `pnpm build`/`typecheck` verdes.

## Recuperación de fallos específicos

- **Clave perdida**: sin `encryptionKey`, libSQL no abre BD cifrada (`DbError: No se pudo crear el cliente`). Recuperar de `KeytarSecretStore` o backup de clave; sin clave solo queda recrear BD (`createDb` sin clave → BD vacía + `migrate` + `syncAccount`).
- **Corrupción `email-ia.db`**: `PRAGMA integrity_check` != `ok` → restaurar último `.bak`; si no hay bak, `rm email-ia.db && migrate` + sync completo.
- **Migración fallida a mitad**: `migrate` lanza `DbError` por fichero; no hay rollback transaccional por fichero — restaurar bak previo y reejecutar tras corregir SQL.
- **Electron no arranca (preload)**: verificar `preload.cjs` vs `dist/preload.mjs` con `existsSync` fallback (`packages/electron/src/main.ts`).
- **OTel deshabilitado**: `OTEL_ENABLED false` es estado esperado (privacy-first); activar solo con `OTEL_EXPORTER_OTLP_ENDPOINT` accesible.

## Referencias

- `ADR-004` (cifrado + `SecretStorePort`), `ADR-005` (modelos), `ADR-009` (health/OTel/Pino + `envSchema`), `ARCHITECTURE_DECISIONS.md:3.5` y `3.8`.
