---
name: hexagonal-email-ia
description: Skill custom arquitectura hexagonal + Shared Kernel para Email IA (referencias odata-server + node-modular-monolith-skill). Usar SIEMPRE antes de crear/modificar código en packages/core, db, ai-provider, backend, shared, electron. Hace cumplir dependency rule inward y ports/adapters.
---

# Hexagonal + Shared Kernel — Email IA

> Filosofía: Desktop First, Electron contenedor, Core reutilizable web (`PROJECT.md:15`, `ENGINEERING.md:5`). Monorepo pnpm custom `pnpm-workspace.yaml:1` sin Nx/Turborepo (ADR-001). Regla: nunca sacrificar arquitectura por velocidad (`AI_CONSTITUTION.md:25`).

## 1. Mapa de paquetes y dependency rule (inward)

```
shared  ←  core  ←  db, ai-provider  ←  backend  ←  electron
                ←  frontend (usa backend vía HTTP/IPC, no importa core directo salvo tipos)
```

| Paquete                | Rol                                                                      | Puede depender de                     | No puede depender de                       |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------ |
| `packages/shared`      | Tipos/utils/constants, config schemas                                    | nada interno                          | core/db/ai-provider/backend                |
| `packages/core`        | Dominio + ports + errors (Shared Kernel)                                 | `shared`                              | `db`, `ai-provider`, `backend`, `electron` |
| `packages/db`          | Adaptadores Drizzle+libSQL                                               | `core`, `shared`                      | `ai-provider`, `backend`                   |
| `packages/ai-provider` | Adaptadores IA (OpenAICompat, Ollama, Llamafile, FilesystemModelManager) | `core`, `shared`                      | `db`, `backend`                            |
| `packages/backend`     | Express + orquestación (futuro)                                          | `core`, `db`, `ai-provider`, `shared` | `electron`, `frontend`                     |
| `packages/electron`    | Main+preload+IPC (`vite-plugin-electron`)                                | `backend`, `core`, `shared`           | `frontend` build separado                  |
| `packages/frontend`    | UI5 MVC                                                                  | `backend` vía HTTP/IPC                | `core` salvo tipos re-exportados           |

**Violación = revert.** Verificar con `codebase-memory` grafo (clusters, CALLS edges) antes de mover código.

## 2. Ports y errores canónicos (ya materializados)

| Puerto/Error                                                                                 | Archivo                                                               | Estado  |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| `AIProviderPort` (chat, embed, listModels, pullModel) + tipos `ChatMessage/Options/Response` | `packages/core/src/ports/ai-provider.port.ts`                         | ADR-003 |
| `ContactRepositoryPort` / `EmailRepositoryPort`                                              | `packages/core/src/ports/*.port.ts`                                   | ADR-004 |
| `SecretStorePort` + `DbError extends AppError`                                               | `packages/core/src/ports/secret-store.port.ts` + `errors/db-error.ts` | ADR-004 |
| `ModelManagerPort` (LocalModelInfo/PullProgress)                                             | `packages/core/src/ports/model-manager.port.ts`                       | ADR-005 |
| `AppError` (code/status/details) + `ProviderError`                                           | `packages/core/src/errors/`                                           | ADR-003 |

Adaptadores implementan ports con **DI** (`fetch`/`spawn`/`fs`/`path` inyectados) — ver `packages/ai-provider/src/*` y `packages/db/src/repositories/*` + `secret-store/*`.

## 3. Reglas de implementación

1. **Port first:** nuevo capability → definir port en `core/src/ports/` + error en `core/src/errors/` → luego adaptador en `db`/`ai-provider`. Nunca implementar lógica en `core`.
2. **DI obligatorio:** nada de `global fetch`, `fs` directo, `child_process.spawn` sin inyección — permite tests sin red/proceso.
3. **Re-exportar contrato:** adaptadores re-exportan tipos del core por compatibilidad, no redefinen.
4. **Shared Kernel mínimo:** `shared` solo tipos isomórficos; dominio queda en `core`.
5. **Electron es contenedor:** `packages/electron/src/main.ts` y `preload.ts` → `dist/main.js` + `dist/preload.mjs` + fallback `preload.cjs` (`sandbox:true` requiere CJS, ADR-006). `ipc.ts` tipado `ping`/`getVersions` vía `ipcMain.handle`/`invoke`.
6. **No duplicar lógica / no código muerto** (`AI_CONSTITUTION.md:28`).

## 4. Validación arquitectónica (sinérgica)

Antes de PR:

- `codebase-memory` query: `search_graph` ports, `trace_path` CALLS para verificar inward.
- `clean-ddd-hexagonal` skill: dependency rule, layer placement.
- `ponytail` (full): ¿puede resolverse con 1 línea/stdlib antes de nuevo port?
- `pnpm typecheck` + `pnpm build` (topológico `pnpm -r build`) + `pnpm test:coverage` (≥80% `vitest.config.ts:24`).

## 5. Referencias

- `ARCHITECTURE_DECISIONS.md:3` (vacíos y D1-D10 resueltas), `ADR-001..007`, `PROJECT_STATE.md:23` (progreso por paquete).
- Repos modelo: `horangelmillan/odata-server` + skill `node-modular-monolith-skill` (no son dependencias, solo filosofía).
