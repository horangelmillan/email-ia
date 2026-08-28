# Runbook 01 — Instalación local

## Objetivo

Dejar un clon limpio del repo en estado verde (`lint` + `format:check` + `typecheck` + `build` + `test:coverage` ≥80 %) y con frontend/electron verificables en local.

## Requisitos previos

- Node 22 LTS (`.nvmrc`) + pnpm 11.11 (`packageManager` en `package.json:6`).
- Git `core.autocrlf false` en Windows (Prettier `eol: lf` + `.gitattributes:2`).
- UI5 CLI v4 requiere Node ≥20.11; Electron `sandbox:true` exige preload CJS (`packages/electron/preload.cjs`).

## Procedimiento

1. Clonar y situarse en `develop` (o `main` para release):
   ```bash
   git clone https://github.com/horangelmillan/email-ia.git
   cd email-ia
   git checkout develop
   git config core.autocrlf false
   ```
2. Instalar:
   ```bash
   pnpm install
   ```
   Respeta `pnpm-workspace.yaml:5` `allowBuilds` (`electron:true`, `esbuild:true`, `msw:true`, `better-sqlite3:false`, `protobufjs:false`). Sin él, el postinstall de electron se bloquea (`ERR_PNPM_IGNORED_BUILDS`).
3. Validación rápida (obligatoria antes de seguir):
   ```bash
   pnpm lint
   pnpm format:check
   pnpm typecheck
   pnpm build
   pnpm test:coverage
   ```
   Umbral en `vitest.config.ts:24` (80 % lines/functions/branches/statements). Baseline `v0.4.0`: 137 tests, 93.24 %/85.74 %.
4. Frontend (opcional):
   ```bash
   pnpm --filter @email-ia/frontend build   # ui5 build --all
   pnpm --filter @email-ia/frontend start   # ui5 serve :8080
   ```
5. Electron (opcional):
   ```bash
   pnpm --filter @email-ia/electron build:vite   # vite build (main+preload)
   pnpm --filter @email-ia/electron dev          # vite + electron HMR
   # empaquetado sin instalar en workspace (hang pnpm Windows ADR-006):
   npx --yes electron-builder --config packages/electron/electron-builder.yml
   ```

## Validación

- `pnpm build` sin errores (frontend `ProjectBuilder Build succeeded` 7 proyectos).
- `pnpm test:coverage` umbral 80 % verde.
- `GET /health` y `GET /ready` (si backend en marcha) responden `200` (`packages/backend/src/app.ts:30`).

## Recuperación

- `pnpm install` falla por `ERR_PNPM_IGNORED_BUILDS`: verificar `pnpm-workspace.yaml:5` y `pnpm approve-builds`.
- `format:check` en rojo por CRLF: `git config core.autocrlf false; git add --renormalize .; pnpm format`.
- `vite` incompatible (requiere `vite@6.3.5` con `vite-plugin-electron@0.28.8`): `pnpm add -D vite@6.3.5`.
- Electron preload ESM error con `sandbox:true`: usar `preload.cjs` (CommonJS) o `dist/preload.mjs` con `existsSync` fallback (`packages/electron/src/main.ts`).

## Referencias

- `ADR-001` (pnpm + monorepo), `ADR-002` (stack), `ADR-006` (UI5 + Electron + CRLF/electron-builder hang).
