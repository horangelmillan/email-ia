# PROJECT STATE

## Estado General

Fase: 2 — Arquitectura base (EN CURSO)

Estado: Tarea 2.1 completada (hexágono base `AIProviderPort` + `AppError`/`ProviderError`, ADR-003). Tarea 2.2 completada: capa de BD con Drizzle + libSQL + migraciones iniciales + SQLCipher (via libSQL encryptionKey) + `SecretStorePort` en Core (ADR-004, 2026-08-20). Siguiente: Runtime IA embebido (llamafile) + adaptadores.

Última actualización: 2026-08-20

---

# Progreso

## Backend

- [x] Stack decidido: Node.js + Express, hexagonal + Shared Kernel (referencias: odata-server, node-modular-monolith-skill)
- [x] Logging (Pino), configuración (dotenv + zod), error handling unificado, health checks decididos
- [x] Scaffolding del paquete `backend` (workspace @email-ia/backend)
- [ ] Lógica real del backend (Express, adapters) — Fase 2

## Core

- [x] Hexágono base materializado en `packages/core`: puerto `AIProviderPort` + tipos (chat, embed, listModels, pullModel) en `src/ports/`, errores de dominio `AppError` (estrategia unificada: code/status/details) y `ProviderError` en `src/errors/` (ADR-003, 2026-08-20)
- [x] `packages/ai-provider` convertido en adaptador del puerto (`OpenAICompatibleProvider` implementa `AIProviderPort` del Core, lanza `ProviderError` del Core, re-exporta contrato por compatibilidad; dep `@email-ia/shared` no usada eliminada)
- [x] Puertos de persistencia en `packages/core` (ADR-004, 2026-08-20): `EmailRepositoryPort`/`ContactRepositoryPort` + `SecretStorePort` y `DbError` (extiende `AppError` con `code DB_ERROR`); exportados desde `@email-ia/core`

## Frontend

- [x] SAPUI5 (MVC) + UI5 CLI v4 decidido
- [x] UI Component Playground + regresión visual (Playwright) decididos
- [x] Scaffolding del paquete `frontend` (placeholder; build/typecheck echo)
- [ ] Bootstrap de la app SAPUI5 con UI5 CLI v4 (routing, models, services) — Fase 2

## IA

- [x] AI Provider desacoplado (multi-runtime: embebido por defecto, Ollama, LM Studio, OpenAI)
- [x] Gestor de modelos, RAG, prompts versionados con golden dataset, offline-first, SQLCipher decididos
- [x] Puerto hexagonal AIProviderPort en `packages/core` (ADR-003, 2026-08-20): `AIProviderPort` (chat, embed, listModels, pullModel) + adaptador `OpenAICompatibleProvider` en `packages/ai-provider` con DI de fetch (tests sin red), normalización de baseUrl (añade `/v1`), timeout 30 s y `ProviderError` (ahora en el Core). `pullModel` no soportado en OpenAI-compat (pendiente runtime embebido en Fase 2)

## Electron

- [x] Spike validado: el Core (`@email-ia/core`, `@email-ia/backend`, `@email-ia/shared`) carga en el proceso main de Electron (sonda `--smoke` OK). Preload CJS (`preload.cjs`) con `sandbox: true` + contextIsolation
- [ ] Fase 2: vite-plugin-electron (HMR) + electron-builder (empaquetado, copia de preload al dist) + IPC renderer ↔ main

## Base de datos

- [x] SQLite + Drizzle/Drizzle Kit + SQLCipher decididos
- [x] Capa de BD materializada (ADR-004, 2026-08-20): `drizzle-orm` + `@libsql/client` (file + `:memory:`, `encryptionKey` para cifrado en reposo; evolución a `better-sqlite3-multiple-ciphers` sin cambiar esquema) + `drizzle-kit` + esquema base `contacts`/`emails` en `packages/db/src/schema/` + primera migración `0001_initial.sql` + helper `migrate()` + `drizzle.config.ts` (raíz y `packages/db`)
- [x] Adaptadores `DrizzleContactRepository`/`DrizzleEmailRepository` implementan puertos del Core en `packages/db/src/repositories/`; `EnvSecretStore` + `KeytarSecretStore` + `createSecretStore()` en `packages/db/src/secret-store/`; cliente centralizado `createDb()`/`createInMemoryDb()` resuelve `DATABASE_URL`/`DATABASE_ENCRYPTION_KEY` o `SecretStorePort` (`email-ia/db-encryption-key`); `DbError` unificado

## Integraciones

- [x] Proveedores objetivo: Gmail, Outlook, IMAP, sistema de archivos (definidos en PROJECT.md)
- [ ] Adaptadores de integración (pendiente Fase 2+)

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
- [ ] Evaluar CodeQL (requiere revisión de cuota Actions) y activar Dependabot alerts/security updates

---

# Backlog

## Alta

- [x] Fase 2 — Arquitectura base: hexagonal + Shared Kernel en `packages/core`, AIProviderPort en `packages/ai-provider` (Tarea 2.1, ADR-003)
- [x] Fase 2 — Capa de BD (Drizzle + libSQL + migraciones + SQLCipher + almacén seguro del SO, ADR-004, 2026-08-20)
- Fase 2 — Runtime IA embebido (llamafile recomendado tras el spike) + adaptadores Ollama/LM Studio
- Fase 2 — UI5 CLI v4: bootstrap de la app SAPUI5, routing, models, services
- Fase 2 — Electron: vite-plugin-electron + electron-builder

## Media

- Fase 3 — CI/CD GitHub Actions completo, dependabot, CodeQL, branch protection
- Fase 3 — Observabilidad: instrumentación OTel activable por configuración, health checks
- Fase 4 — Contrato de integraciones Gmail/Outlook/IMAP (Pact), adaptadores

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

- Ninguno. La definición está completa y no impide iniciar la Fase 1.

---

# Próxima tarea

- Fase 2 · Tarea 3 — Runtime IA embebido (llamafile recomendado tras el spike) + adaptadores Ollama/LM Studio (configurables vía `AIProviderPort`); verificar binario único portable sin instalación.

---

# Commits pendientes

- PR (feature/fase2-db-drizzle-sqlcipher, en curso): ADR-004 + capa de BD (Drizzle + libSQL + migraciones 0001 + `SecretStorePort`/`DbError` en Core + adaptadores `Drizzle*Repository` + `EnvSecretStore`/`KeytarSecretStore` + `createDb`/`migrate`); baseline verde (40 tests, cobertura 91.5 % statements / 80.7 % branches).

---

# Notas

- Decisiones D1-D10 resueltas (2026-08-19). Detalle en ARCHITECTURE_DECISIONS.md y ADR-001/ADR-002.
- ADR-003 (2026-08-20): puertos y errores de dominio en `packages/core`; adaptadores fuera del núcleo.
- ADR-004 (2026-08-20): capa de BD — Drizzle + libSQL + migraciones + SecretStore + cifrado; `better-sqlite3` pospuesto por toolchain nativa.
- Proceso de ADR formalizado: numeración secuencial, nunca modificar historial, decisiones sustituidas referenciadas por ADR nuevos.
- ENGINEERING.md y PROJECT.md no requieren cambios; sus referencias a "plantilla oficial" se interpretan según §4 de ARCHITECTURE_DECISIONS.md (repositorios de referencia, no plantillas rígidas).
