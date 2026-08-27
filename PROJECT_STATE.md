# PROJECT STATE

## Estado General

Fase: 2 — Arquitectura base (COMPLETADA) → Fase 3A CI/CD completa → Fase 3B Observabilidad completa (2026-08-27) → Fase 4 Contratos base mergeado (2026-08-27) → Fase 4 completo Pact+MSW+OAuth+sync en `feature/fase4-pact-msw-sync` (2026-08-27)

Estado: Tarea 2.1 completada (hexágono base `AIProviderPort` + `AppError`/`ProviderError`, ADR-003). Tarea 2.2 completada: capa de BD con Drizzle + libSQL + migraciones + `SecretStorePort` (ADR-004, 2026-08-20). Tarea 2.3 completada: runtime IA embebido (llamafile + `ModelManagerPort`) + adaptadores Ollama/LM Studio + factory multi-runtime (ADR-005, 2026-08-20). Tarea 2.4 completada: UI5 CLI v4 bootstrap + Electron vite-plugin-electron + IPC (ADR-006, 2026-08-22). Fase 3A completada: CI endurecido + CodeQL + branch protection `develop` (ADR-007, 2026-08-26). Fase 3B completada: observabilidad Pino + OTel SDK opcional + health checks (ADR-009, 2026-08-27). Fase 4 contrato base **mergeado** PR #14 `c901cf1` (125 tests, 92.84%/85.08%). Fase 4 completo **en rama** `feature/fase4-pact-msw-sync`: `HttpEmailProvider` + `TokenProvider` (DI Bearer, `Authorization` header, `healthCheck` con auth) + `EmailSyncService` (`syncAccount` incremental offline-first, paginación `pageToken` loop, upsert `EmailRepositoryPort` server-wins) + MSW handlers (`msw/node` `createHandlers`) + Pact V3 consumer (`pacts/email-ia-backend-email-provider-api.json`, 4 interacciones list/get/health). Baseline verde en feature (137 tests, 93.36%/85.67% cobertura, lint/typecheck/build/format:check OK).

Última actualización: 2026-08-27

---

# Progreso

## Backend

- [x] Stack decidido: Node.js + Express, hexagonal + Shared Kernel (referencias: odata-server, node-modular-monolith-skill)
- [x] Logging (Pino), configuración (dotenv + zod), error handling unificado, health checks decididos
- [x] Scaffolding del paquete `backend` (workspace @email-ia/backend)
- [x] Fase 3B — Observabilidad (ADR-009, 2026-08-27): `createLogger` (Pino, `level`/`enabled`, DI `DestinationStream`), `createOtelSdk` (`OTEL_ENABLED` false por defecto, `NodeSDK` + `OTLPTraceExporter` http + `resourceFromAttributes(service.name)`, DI `NodeSdkCtor`/`exporterFactory`), `getHealth`/`getReadiness` puros, `createApp` (`helmet`+`cors`+`compression`+`express.json`, `pino-http` opcional, `GET /health` `GET /ready` 200/503, `setup` hook, error handler `AppError→status/code`); `shared` `envSchema`/`parseEnv`/`loadEnv` (zod 4.4.3, `PORT`/`LOG_LEVEL`/`OTEL_*`/`DATABASE_*`); 103 tests, 91.62%/82.15% cobertura, `allowBuilds: {protobufjs:false}`

## Core

- [x] Hexágono base materializado en `packages/core`: puerto `AIProviderPort` + tipos (chat, embed, listModels, pullModel) en `src/ports/`, errores de dominio `AppError` (estrategia unificada: code/status/details) y `ProviderError` en `src/errors/` (ADR-003, 2026-08-20)
- [x] `packages/ai-provider` convertido en adaptador del puerto (`OpenAICompatibleProvider` implementa `AIProviderPort` del Core, lanza `ProviderError` del Core, re-exporta contrato por compatibilidad; dep `@email-ia/shared` no usada eliminada)
- [x] Puertos de persistencia en `packages/core` (ADR-004, 2026-08-20): `EmailRepositoryPort`/`ContactRepositoryPort` + `SecretStorePort` y `DbError` (extiende `AppError` con `code DB_ERROR`); exportados desde `@email-ia/core`
- [x] `ModelManagerPort` en `packages/core` (ADR-005, 2026-08-20): `LocalModelInfo`/`PullProgress` + `listLocalModels`/`pullModel`/`removeModel`/`getModelPath`; adaptador `FilesystemModelManager` en `packages/ai-provider` (DI fs/fetch/path, streaming + progreso)
- [x] `EmailProviderPort` + `IntegrationError` en `packages/core` (Fase 4, 2026-08-27): `EmailProviderPort` (`providerId`, `listMessages(accountId, {maxResults, pageToken})→{messages,nextPageToken}`, `getMessage`, `healthCheck`) + tipos `EmailProviderId/Message/ListOptions/Result` + `IntegrationError extends AppError` (`code INTEGRATION_ERROR`); `exactOptionalPropertyTypes` con `| undefined`

## Frontend

- [x] SAPUI5 (MVC) + UI5 CLI v4 decidido
- [x] UI Component Playground + regresión visual (Playwright) decididos
- [x] Scaffolding del paquete `frontend` (placeholder; build/typecheck echo) — Fase 1
- [x] Bootstrap UI5 CLI v4 completado (ADR-006, 2026-08-22): `ui5.yaml` (specVersion 4.0, OpenUI5 1.133.0), `webapp/Component.js`, `manifest.json` (routing `home`/`inbox`, modelos `i18n`/`app`), `view/App.view.xml` + `Home`/`Inbox`, `controller/App`/`Home`/`Inbox`, `model/models.js` (app/device), `service/EmailService.js` (healthCheck placeholder), `i18n/*.properties` (en/es), `css/style.css`; build `ui5 build --all` OK (7 proyectos, 30-38 s), `ui5 serve` OK

## IA

- [x] AI Provider desacoplado (multi-runtime: embebido por defecto, Ollama, LM Studio, OpenAI)
- [x] Gestor de modelos, RAG, prompts versionados con golden dataset, offline-first, SQLCipher decididos
- [x] Puerto hexagonal AIProviderPort en `packages/core` (ADR-003, 2026-08-20): `AIProviderPort` (chat, embed, listModels, pullModel) + adaptador `OpenAICompatibleProvider` en `packages/ai-provider` con DI de fetch (tests sin red), normalización de baseUrl (añade `/v1`), timeout 30 s y `ProviderError` (ahora en el Core). `pullModel` no soportado en OpenAI-compat (pendiente runtime embebido en Fase 2)
- [x] Runtime IA embebido materializado (ADR-005, 2026-08-20): `OllamaProvider` (`POST /api/pull`, NDJSON, normaliza `/v1`→`/api`, timeout 300 s), `LlamafileRuntime` (binaryPath/modelPath/host/port/args, DI spawn/fetch/fs, `getServerUrl`/`healthCheck`/`start`/`stop` con poll 5 s), `FilesystemModelManager` (DI fs/fetch) y factory `createAIProvider({provider, baseUrl, llamafile}, fetchImpl, {llamafileRuntime})` con defaults `ollama:11434/lmstudio:1234/llamafile:8080`; 72 tests, cobertura 91 %/81.3 %

## Electron

- [x] Spike validado: el Core (`@email-ia/core`, `@email-ia/backend`, `@email-ia/shared`) carga en el proceso main de Electron (sonda `--smoke` OK). Preload CJS (`preload.cjs`) con `sandbox: true` + contextIsolation
- [x] Fase 2 completada (ADR-006, 2026-08-22): `vite@6.3.5` + `vite-plugin-electron@0.28.8` (HMR) + `vite.config.ts` (main `src/main.ts` → `dist/main.js`, preload `src/preload.ts` → `dist/preload.mjs` + `dist-electron/preload.mjs`, renderer `dist/index.html`), `electron-builder.yml` (appId `com.emailia.app`, files `dist/**/*` + `preload.cjs`/`index.html`), IPC tipado (`ipc.ts` + `preload.ts`/`preload.cjs` expone `ping`/`getVersions` vía `ipcMain.handle`/`ipcRenderer.invoke`), `pnpm --filter @email-ia/electron dev/build:vite/package` OK; `pnpm build` (tsc) + `pnpm typecheck` verdes; empaquetado vía `npx electron-builder` (paquete no instalado en workspace por hang pnpm en Windows — ver Hallazgos)

## Base de datos

- [x] SQLite + Drizzle/Drizzle Kit + SQLCipher decididos
- [x] Capa de BD materializada (ADR-004, 2026-08-20): `drizzle-orm` + `@libsql/client` (file + `:memory:`, `encryptionKey` para cifrado en reposo; evolución a `better-sqlite3-multiple-ciphers` sin cambiar esquema) + `drizzle-kit` + esquema base `contacts`/`emails` en `packages/db/src/schema/` + primera migración `0001_initial.sql` + helper `migrate()` + `drizzle.config.ts` (raíz y `packages/db`)
- [x] Adaptadores `DrizzleContactRepository`/`DrizzleEmailRepository` implementan puertos del Core en `packages/db/src/repositories/`; `EnvSecretStore` + `KeytarSecretStore` + `createSecretStore()` en `packages/db/src/secret-store/`; cliente centralizado `createDb()`/`createInMemoryDb()` resuelve `DATABASE_URL`/`DATABASE_ENCRYPTION_KEY` o `SecretStorePort` (`email-ia/db-encryption-key`); `DbError` unificado

## Integraciones

- [x] Proveedores objetivo: Gmail, Outlook, IMAP, sistema de archivos (definidos en PROJECT.md)
- [x] Fase 4 contrato base (2026-08-27): `EmailProviderPort` en `packages/core` + `IntegrationError`; adaptadores en `packages/backend/src/integrations/` — `FakeEmailProvider` (in-memory con `seed`, paginación offset/`pageToken`/`maxResults`) + `HttpEmailProvider` (DI fetch, `normalizeBaseUrl`, `GET /messages?accountId&maxResults&pageToken` + `GET /messages/:id?accountId` + `GET /health`, `IntegrationError` en HTTP no ok/404→null, `healthCheck` false en error) + `createEmailProvider({provider, baseUrl, initialData})` con defaults `gmail/outlook/imap`; dependency rule `shared←core←backend` preservada, `AppError` mapping vía `AppError` handler de `createApp`
- [x] Fase 4 completo — contratos formales Pact + MSW + OAuth/token + sync incremental (2026-08-27): `HttpEmailProvider` extendido con `TokenProvider` DI (`Bearer` en `Authorization`, `getAuthHeaders` en `request`/`healthCheck`, 30s timeout), `createEmailProvider` con `tokenProvider` opcional, `EmailSyncService` (`packages/backend/src/sync/email-sync.service.ts`, `syncAccount` loop `pageToken`, upsert `EmailRepositoryPort` findById→create/update, server-wins, offline-first incremental), MSW (`msw@2.8.6`, `setupServer`, `createHandlers` para `GET /messages` paginado + `GET /messages/:id` 404 + `GET /health`) y Pact V3 consumer (`@pact-foundation/pact@15.0.1`, `consumer email-ia-backend`/`provider email-provider-api`, 4 interacciones en `pacts/email-ia-backend-email-provider-api.json`, `msw:true` en `allowBuilds`)

## Testing

- [x] Vitest (backend/frontend), Supertest, Playwright, Pact + MSW, faker/factories decididos
- [x] Configuración real: Vitest 4 (workspace, aliases @email-ia/* → src, cobertura umbral 80%) y Playwright (config raíz, e2e/)
- [~] Estrategia de testing IA (golden dataset/evals definida en §3.7; materializar en Fase 2)
- [ ] Instalación de browsers Playwright cuando existan tests e2e reales

## Seguridad

- [x] Helmet, CORS, Compression; secrets solo por entorno; secret scanning decididos
- [x] Cifrado en reposo con SQLCipher + claves en almacén seguro del SO decididos
- [ ] Implementación (pendiente Fase 1+)

## CI/CD

- [x] CI (lint, typecheck, test, build), dependabot, npm audit + CodeQL (evaluar), Gitleaks/TruffleHog, branch protection main/dev decididos
- [x] CD: solo local por ahora (sin destino de despliegue)
- [x] Workflow CI inicial (`.github/workflows/ci.yml`) + dependabot.yml creados
- [x] Remoto activo y branch protection en `main` (2026-08-20): repo público `horangelmillan/email-ia` (plan Free: protección de ramas solo en repos públicos), `develop` creado desde `main`, reglas: PR obligatorio + check `quality` + enforce admins + sin force push/deleción. `required_approving_review_count = 0` (repo en solitario: GitHub no permite auto-aprobación del propio PR; subir a ≥1 cuando haya más colaboradores)
- [x] Fase 3A CI/CD completo (ADR-007, 2026-08-26): `ci.yml` endurecido (`concurrency` cancel-in-progress, `permissions: contents:read`, `timeout 15 min`, pasos `lint → format:check → typecheck → build → test:coverage threshold 80 % → gitleaks`), `.github/workflows/codeql.yml` (`javascript-typescript`, `security-and-quality`, push/PR + schedule semanal), `develop` protegido (mismo `quality` gate que `main` vía `gh api PUT` — 404 resuelto), `dependabot.yml` verificado (`pnpm` + `github-actions` weekly, alerts activables en Settings)

---

# Backlog

## Alta

- [x] Fase 2 — Arquitectura base: hexagonal + Shared Kernel en `packages/core`, AIProviderPort en `packages/ai-provider` (Tarea 2.1, ADR-003)
- [x] Fase 2 — Capa de BD (Drizzle + libSQL + migraciones + SQLCipher + almacén seguro del SO, ADR-004, 2026-08-20)
- [x] Fase 2 — Runtime IA embebido (llamafile + adaptadores Ollama/LM Studio + ModelManagerPort, ADR-005, 2026-08-20)
- [x] Fase 2 — UI5 CLI v4: bootstrap de la app SAPUI5, routing, models, services (ADR-006, 2026-08-22)
- [x] Fase 2 — Electron: vite-plugin-electron + electron-builder + IPC (ADR-006, 2026-08-22)

## Media

- [x] Fase 3A — CI/CD GitHub Actions completo, dependabot, CodeQL, branch protection (ADR-007, 2026-08-26)
- [x] Fase 3B — Observabilidad (ADR-009, 2026-08-27): Pino + OTel SDK opcional (OTLP http off por defecto, privacy-first) + health checks Express (`@email-ia/shared` zod + `@email-ia/backend` factory)
- [x] Fase 4 — Contrato de integraciones Gmail/Outlook/IMAP base (2026-08-27): puerto + `IntegrationError` + `Fake`/`Http` + factory con DI y 22 tests (125 totales, 92.84%/85.08% cobertura) mergeado en `develop` (PR #14 `c901cf1`, `quality`+CodeQL verdes, hotfix regex incluido)
- [x] Fase 4 — Contratos formales Pact + MSW + OAuth/token + sync incremental offline-first (§3.7) (2026-08-27): `TokenProvider` Bearer + `EmailSyncService` incremental + MSW `createHandlers` + Pact V3 4 interacciones (137 tests, 93.36%/85.67%) en `feature/fase4-pact-msw-sync` listo para PR a `develop`

## Baja

- Fase 4+ — Runbooks operativos
- Futuro — Reevaluar Nx/Turborepo, Loki/Tempo o SaaS si hay destino de despliegue

---

# Hallazgos

- UI5 Tooling fue renombrado a **UI5 CLI v4** (2025): el build "webpack estándar" ya no es la base oficial; Vite sigue siendo middleware comunitario. La tabla de decisiones original estaba desactualizada.
- La tabla de decisiones (§6) no reflejaba las respuestas ya dadas en §3 (desincronización corregida el 2026-08-19).
- Las referencias a "plantillas oficiales" inexistentes (hexagonal/SAPUI5) se resolvieron con repositorios de referencia: odata-server + node-modular-monolith-skill (backend) y SmartInventory-frontend (frontend, copia local).
- Vitest 4 no resuelve sus tipos internos con `moduleResolution: NodeNext`: la config de desarrollo usa `ESNext + Bundler` (editor/tests) y la de build `NodeNext` (emisión), con `exclude` de `*.test.ts` en build.
- `@types/node` fijado a ^22 para coincidir con el runtime (Node 22 LTS, .nvmrc).
- Spike IA (2026-08-19): **node-llama-cpp** solo es compatible con el proceso main de Electron (bindings nativos, fallback build from source); **llamafile** es un binario único portable con servidor OpenAI-compatible sin instalación → runtime embebido recomendado para Fase 2. LM Studio (`http://localhost:1234/v1`) y Ollama (`http://localhost:11434/v1`) exponen la misma API OpenAI-compatible (`/v1/chat/completions`, `/v1/embeddings`, `/v1/models`).
- Spike Electron (2026-08-19): los preloads de Electron **deben ser CommonJS** (`.cjs`) con `sandbox: true` (ESM no soportado en preload sandboxed); los paquetes del Core se resuelven vía workspaces pnpm (dist previo con `pnpm build`).
- pnpm 11: los ajustes de build de dependencias ya no se leen del campo `pnpm` de package.json ni de `onlyBuiltDependencies`; usan `allowBuilds` en `pnpm-workspace.yaml` (mapa nombre → booleano). Sin él, el postinstall de electron (descarga del binario) se bloquea con `ERR_PNPM_IGNORED_BUILDS`.
- Windows + `core.autocrlf=true` (2026-08-20): los checkouts salen con CRLF y Prettier (default `endOfLine: lf`) los marca como no formateados → `format:check` fallaba en 4 archivos con contenido correcto. Fix: `.gitattributes` (`text=auto` + `eol=lf` en código/documentación).
- `PROJECT_STATE.md` (2026-08-20): la sección "Commits pendientes" listaba el commit del spike ya mergeado; se corrigió. Además `develop` quedó 1 commit detrás de `main` tras el PR #1 (branch protection, merge directo a main): sincronizada vía PR #2.
- Fase 2 DB (2026-08-20): `better-sqlite3@13.0.3` requiere VS Build Tools (gyp ERR! Could not find any Visual Studio installation) en Windows Node 22; se adoptó `@libsql/client` + `drizzle-orm/libsql` para evitar compilación nativa manteniendo `encryptionKey` (cifrado libSQL) y compatibilidad futura con `better-sqlite3-multiple-ciphers` (cambio solo en `packages/db/src/client/connection.ts`). `drizzle-kit` trae `better-sqlite3` opcional: bloqueado en `allowBuilds:false` + `esbuild:true` para `pnpm approve-builds`.
- Fase 2 IA (2026-08-20): `exactOptionalPropertyTypes:true` exige `?: T | undefined` explícito y `Required` con unión no propaga; `LlamafileRuntimeConfig`/`FactoryDeps` requirieron `host?: string | undefined` + spread condicional `...(host!==undefined?{host}:{})` para no pasar `undefined` como valor; `FilesystemModelManager` streaming bifurca `body.getReader` vs `arrayBuffer` fallback (dos ramas cubiertas con tests DI fs/fetch).
- Fase 2 UI+Electron (2026-08-22): `core.autocrlf=true` recayó tras `pnpm add` (46 files con CRLF) → fix `git config core.autocrlf false` + `git add --renormalize .` + `pnpm format` (Prettier `eol=lf`). UI5 CLI v4 `ui5.yaml` exige `specVersion 4.0` + `framework OpenUI5 1.133.0`; `manifest.json` warning `fallbackLocale 'en'` sin `i18n_en.properties` → crear `i18n_en.properties`/`i18n_es.properties`. `vite-plugin-electron@0.28.8` requiere `vite@6` (no 8) y `preload` output por defecto `dist-electron/` → configurar `vite.build.outDir='dist'` para unificar; `resolvePreloadPath()` con `existsSync` para fallback `preload.mjs` vs `preload.cjs`. `electron-builder@25.1.8` en workspace causa hang infinito de `pnpm --filter`/`pnpm -r` en Windows (pnpm store scan >120 s con 25.1.8 deps) → retirado de `@email-ia/electron/package.json`, empaquetado vía `npx --yes electron-builder` sin instalar en workspace; `pnpm build/typecheck/test` recuperados (exit 0). ESLint `dist-electron/preload.mjs` con `require` ignorado vía `eslint.config.js: ignores dist-electron/release` y `.prettierignore`.
- Fase 3A CI/CD (2026-08-26): `ci.yml` sin `format:check` omitía gate de `LF` (`.gitattributes eol=lf`) y sin `concurrency` malgastaba minutos Actions → añadidos `format:check`, `concurrency: ci-${{ github.ref }} cancel-in-progress`, `permissions: contents:read`, `timeout 15 min`, step `Test with coverage (threshold 80%)`. `develop` no estaba protegido (404 `gh api branches/develop/protection`) pese a `PROJECT_STATE.md:77` — corregido vía `gh api PUT` con `strict:true, contexts:[quality], enforce_admins:true`. `codeql.yml` añadido (`javascript-typescript`, `security-and-quality`, push/PR + cron semanal) con `security-events:write` solo en job; coste ~3 min/run en plan Free. `ADR-007` registra decisión. `pnpm format` corrige `ADR-007.md` para `format:check` verde.
- Fase 3B Observabilidad (2026-08-27): `pino-http` con `import * as` para `NodeNext` (`build` falla con `export=`), `protobufjs` `allowBuilds:false` (OTLP deshabilitado por defecto no necesita build), `AppError` branches + `pino-http` levels fix en tests (`createLogger` real vs mock), `createApp.setup` hook para testear error handler sin duplicar lógica, `portSchema`/`booleanFromString` branches en `envSchema` (`loadEnv` con `dotenv`); cobertura 91.62%/82.15% (103 tests).
- Fase 4 contrato base (2026-08-27): `EmailProviderPort` + `IntegrationError` en `packages/core` (port first, `exactOptionalPropertyTypes` con `| undefined`), `packages/backend/src/integrations/` con `FakeEmailProvider` (Map + `seed`, paginación `pageToken` offset) + `HttpEmailProvider` (DI fetch, `normalizeBaseUrl` con `IntegrationError 400`, `listMessages`/`getMessage` con `404→null`, `healthCheck` try/catch) + `factory createEmailProvider`. Tests DI fetch con `vi.fn` sin red (19 tests integraciones + 3 `IntegrationError`); `fake-email-provider.test.ts` fix `toHaveLength` sobre `.messages` (objeto `EmailProviderListResult`); cobertura 92.88%/84.85% (125 tests).
- Fase 4 hotfix CodeQL (2026-08-27): `normalizeBaseUrl`/`normalizeOllamaBase` usaban `replace(/\/+$/, '')` — CodeQL `Polynomial regular expression` high severity en `http-email-provider.ts:15` (PR #14). Fix: `stripTrailingSlash` con loop `while (end>0 && s[end-1]==='/')` sin regex en `http-email-provider.ts:14`, `openai-compatible-provider.ts:16`, `ollama-provider.ts:12` (todos los `replace(/\/+$/, '')` del repo); `OllamaProvider` constructor simplificado a `stripTrailingSlash` único; cobertura 92.84%/85.08% (125 tests) verde, lint/typecheck/build/format:check OK. PR #14 mergeado squash `c901cf1` a `develop` con `quality`+CodeQL SUCCESS (anterior failure resuelto).
- Fase 4 completo Pact+MSW+sync+token (2026-08-27): `HttpEmailProvider` + `TokenProvider` DI (`Authorization: Bearer`, `getAuthHeaders`), `EmailSyncService` incremental (`syncAccount` pageToken loop, upsert `EmailRepositoryPort` con server-wins, offline-first), MSW `msw@2.8.6` (`createHandlers` paginado + 404 + health) y Pact V3 `@pact-foundation/pact@15.0.1` (`email-ia-backend→email-provider-api` 4 interacciones, pact file `pacts/email-ia-backend-email-provider-api.json`). `msw:true` en `allowBuilds` (postinstall ok), 137 tests 93.36%/85.67% cobertura, `pnpm lint/typecheck/build/format:check` verdes. Bloqueo OAuth real (client id/secret Gmail/Outlook/IMAP sin credenciales) mitigado vía `TokenProvider` callback + `SecretStorePort`; adaptadores reales Gmail/Outlook usan mismo `HttpEmailProvider` con `tokenProvider` vía `SecretStore` (no hardcode secrets) y sync incremental ya valida contrato offline-first (§3.7).

---

# Riesgos

| Riesgo                                                      | Probabilidad | Impacto | Mitigación                                                                              |
| ----------------------------------------------------------- | ------------ | ------- | --------------------------------------------------------------------------------------- |
| Runtime embebido (llama.cpp/llamafile) con binarios nativos | Media        | Medio   | Spike resuelto: llamafile (binario único) + adaptadores alternativos (Ollama/LM Studio) |
| Testing IA no determinístico                                | Alta         | Alto    | Evals + golden dataset (§3.7)                                                           |
| Secrets en repo (credenciales email)                        | Media        | Crítico | Secret scanning + .gitignore estricto + secrets solo por entorno                        |
| UI5 CLI v5 (en desarrollo) rompe build futuro               | Baja         | Medio   | Monitorear releases; migración planificada                                              |

---

# Bloqueadores

- Ninguno bloqueante. Fase 4 completo Pact+MSW+token+sync implementado en `feature/fase4-pact-msw-sync` (137 tests, `quality` verde local, pendiente PR `develop` para `quality`+CodeQL en remoto). OAuth real Gmail/Outlook/IMAP sin credenciales de test — mitigado con `TokenProvider` DI + `SecretStorePort` (keytar/env) sin hardcode; MSW/Pact validan contrato sin red externa. Hang pnpm + electron-builder sigue mitigado (paquete fuera workspace). CodeQL cuota Free monitoreada. OTel off por defecto sin infra. Pact file genera warning `older specification version V3 will be upgraded` no bloqueante (Pact V3→V4 auto-upgrade).

---

# Próxima tarea

- Fase 4 cierre — PR `feature/fase4-pact-msw-sync → develop` (Pact+MSW+OAuth+sync) con `quality` + CodeQL en verde, luego merge `develop → main` con tag SemVer. Siguiente: Runbooks operativos (`docs/runbooks/*.md` por operación: instalación, migraciones, gestión modelos IA, sync incremental, recuperación) según ARCHITECTURE_DECISIONS §3.8, y reevaluar Loki/Tempo/SaaS solo si hay destino de despliegue (ADR-002 §Observabilidad, ADR-009).

---

# Commits pendientes

- `feature/fase4-pact-msw-sync` — listo para `pnpm lint && pnpm format:check && pnpm typecheck && pnpm build && pnpm test:coverage` (137 tests 93.36%/85.67% verdes) y PR a `develop`.

  ```bash
  git checkout feature/fase4-pact-msw-sync
  pnpm lint && pnpm format:check && pnpm typecheck && pnpm build && pnpm test:coverage
  git add -A && git commit -m "feat(integrations): Pact+MSW contracts + token + sync incremental offline-first"
  git push origin feature/fase4-pact-msw-sync && gh pr create --base develop --title "feat(integrations): Pact+MSW contracts + token + sync incremental" --body "Fase 4 completo (§3.7) — ver PROJECT_STATE.md"
  ```

---

# Notas

- Decisiones D1-D10 resueltas (2026-08-19). Detalle en ARCHITECTURE_DECISIONS.md y ADR-001/ADR-002.
- ADR-003 (2026-08-20): puertos y errores de dominio en `packages/core`; adaptadores fuera del núcleo.
- ADR-004 (2026-08-20): capa de BD — Drizzle + libSQL + migraciones + SecretStore + cifrado; `better-sqlite3` pospuesto por toolchain nativa.
- ADR-005 (2026-08-20): runtime embebido llamafile (binario único) + Ollama/LM Studio + ModelManagerPort; factory multi-runtime con DI.
- ADR-006 (2026-08-22): bootstrap UI5 CLI v4 (OpenUI5 1.133.0) + vite-plugin-electron (HMR) + electron-builder + IPC tipado; `core.autocrlf` y `pnpm + electron-builder` hang documentados.
- ADR-007 (2026-08-26): CI/CD completo — `ci.yml` con `format:check` + `concurrency` + `timeout`, `codeql.yml` JS/TS + `develop` protegido; `dependabot.yml` verificado.
- ADR-008 (2026-08-27): Harness completo — `ponytail` + 20+ skills + 2 locales + eslint MCP, `AGENTS.md` sinérgico.
- ADR-009 (2026-08-27): Observabilidad Fase 3B — `Pino` + `OTel SDK` opcional (OTLP http off por defecto, privacy-first) + health checks (`/health`/`/ready`, `AppError` mapping) + `zod` config (`@email-ia/shared`).
- Fase 4 contrato base (2026-08-27): `EmailProviderPort` + `IntegrationError` en `core` + `FakeEmailProvider`/`HttpEmailProvider` + `createEmailProvider` en `backend` (DI fetch, timeout 30s, paginación, `IntegrationError`); hexagonal `shared←core←backend` preservado.
- Fase 4 completo Pact+MSW+token+sync (2026-08-27): `HttpEmailProvider` + `TokenProvider` Bearer + `syncAccount` incremental + MSW `createHandlers` + Pact V3 4 interacciones (137 tests, 93.36%/85.67%, `msw:true` allowBuilds) en `feature/fase4-pact-msw-sync`.
- Proceso de ADR formalizado: numeración secuencial, nunca modificar historial, decisiones sustituidas referenciadas por ADR nuevos.
- ENGINEERING.md y PROJECT.md no requieren cambios; sus referencias a "plantilla oficial" se interpretan según §4 de ARCHITECTURE_DECISIONS.md (repositorios de referencia, no plantillas rígidas).
