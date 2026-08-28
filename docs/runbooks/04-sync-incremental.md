# Runbook 04 — Sincronización incremental offline-first

## Objetivo

Mantener la BD local como fuente de verdad (`packages/db` + `EmailRepositoryPort` en `packages/core`) y sincronizar incrementalmente con el proveedor externo vía `EmailProviderPort` (`packages/core/src/ports/email-provider.port.ts`) sin pérdida de datos.

## Requisitos previos

- Puerto `EmailProviderPort`: `listMessages(accountId, {maxResults, pageToken})→{messages,nextPageToken}`, `getMessage(accountId,messageId)→Message|null`, `healthCheck()` (`ADR-004`/`ADR-005`).
- Implementaciones: `FakeEmailProvider` (Map + `seed`, paginación offset) y `HttpEmailProvider` (DI `fetch`, timeout 30 s, `normalizeBaseUrl` sin regex, `Bearer` vía `TokenProvider` opcional) en `packages/backend/src/integrations/`.
- Sync `syncAccount(accountId, provider, repo, {maxResultsPerPage})→{synced, accountId}` (`packages/backend/src/sync/email-sync.service.ts:18`) con loop `pageToken`, upsert `findById→create/update`, server-wins (subject/snippet/body/isRead/threadId/receivedAt).
- MSW `createHandlers` (`packages/backend/src/integrations/mocks/handlers.ts`) y Pact V3 (`pacts/email-ia-backend-email-provider-api.json`, 4 interacciones) validan contrato sin red (`msw:2.8.6`).

## Procedimiento

1. Configurar provider con auth (si aplica):
   ```ts
   import { createEmailProvider } from '@email-ia/backend';
   import type { TokenProvider } from '@email-ia/core';
   const tokenProvider: TokenProvider = { getToken: async () => env.GMAIL_TOKEN };
   const provider = createEmailProvider({
     provider: 'gmail',
     baseUrl: 'https://api.email.example',
     tokenProvider,
   });
   ```
   `HttpEmailProvider` inyecta `Authorization: Bearer <token>` en `request` y `healthCheck` (`getAuthHeaders`).
2. Resolver repo:
   ```ts
   import { createDb } from '@email-ia/db';
   import { DrizzleEmailRepository } from '@email-ia/db';
   const db = await createDb(); // file:email-ia.db o :memory: en tests
   const repo = new DrizzleEmailRepository(db);
   ```
3. Ejecutar sync incremental:
   ```ts
   import { syncAccount } from '@email-ia/backend/sync';
   const { synced } = await syncAccount('acc1', provider, repo, { maxResultsPerPage: 50 });
   ```
   Itera `pageToken` hasta `undefined`; idempotente (re-sync no duplica).
4. Validar offline-first: todas las lecturas posteriores usan `repo` local; sync solo añade/actualiza.

## Validación

- `pnpm test:coverage` verde: `email-sync.service.test.ts` (loop `pageToken`, upsert server-wins, `accountId` obligatorio), `http-email-provider.test.ts` (DI `fetch`, `404→null`), `handlers.test.ts` (MSW paginado + 404 + health).
- Pact consumer `email-ia-backend→email-provider-api` (4 interacciones `GET /messages`, `GET /messages/:id`, `GET /health`) en `pacts/` sin cambio semántico tras `pnpm format`.
- `provider.healthCheck()` → `true/false` (false en error, no lanza).

## Recuperación

- `IntegrationError` (HTTP no ok, `normalizeBaseUrl` 400): verificar `baseUrl`, `pageToken`/`maxResults`, y `Authorization` si `TokenProvider` falla.
- Token expirado (401 en `HttpEmailProvider`): refrescar vía `SecretStorePort` (`email-ia/<account>-token`) y reintentar `syncAccount`.
- Provider paginación infinita (`nextPageToken` repetido): el loop termina solo con `undefined`; si el mock/provider devuelve token cíclico, corregir `FakeEmailProvider`/`HttpEmailProvider`.
- Conflicto server-wins no deseado: para metadatos de correo (`subject/snippet/body/isRead`) gana servidor; cambios locales de configuración no se sincronizan — ajustar estrategia solo vía código (`email-sync.service.ts:35`).
- Sin red: usar `FakeEmailProvider` con `seed` o MSW `setupServer(createHandlers())` para tests/CI offline.

## Referencias

- `ADR-004` (puertos + `IntegrationError`), `ADR-005`/`ADR-002` §IA, `ARCHITECTURE_DECISIONS.md:3.7` (offline-first + server-wins + paginación `pageToken`).
