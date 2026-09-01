# Email IA

Aplicación Full Stack Desktop First (Electron) para gestión inteligente de correos con IA local.

## Stack

- **Frontend**: SAPUI5 (MVC, UI5 CLI v4)
- **Backend**: Node.js + Express, arquitectura hexagonal + Shared Kernel
- **Persistencia**: SQLite + Drizzle + SQLCipher (claves en almacén seguro del SO)
- **IA**: AI Provider desacoplado (runtime embebido por defecto; Ollama, LM Studio, OpenAI como adaptadores)
- **Desktop**: Electron (vite-plugin-electron + electron-builder)
- **Monorepo**: pnpm workspaces

## Estructura

```
packages/
   core/          # Núcleo hexagonal: puertos + errores (Shared Kernel, ModelManagerPort)
   backend/       # Express + adapters (HTTP, DB, Email, AI)
   frontend/      # App SAPUI5 (UI5 CLI v4, Component, routing, models, services, i18n)
   electron/      # Main + Preload + IPC (vite-plugin-electron HMR, electron-builder)
   ai-provider/   # Adaptadores AI (OpenAI-compatible, Ollama, LlamafileRuntime, FilesystemModelManager, factory)
   db/            # Capa de BD (Drizzle + libSQL + migraciones 0001 + SecretStore)
   shared/        # Types, utils, constantes, schemas
 tools/
   eslint-config/ # Config ESLint compartida
   tsconfig/      # Config TypeScript compartida
   prettier-config/
 docs/adr/        # Decisiones arquitectónicas (ADR-001 .. ADR-006)
 drizzle.config.ts # Drizzle Kit (raíz + packages/db/drizzle.config.ts)
```

## Requisitos

- Node.js 22 LTS (ver `.nvmrc`)
- pnpm 9+

## Desarrollo

```bash
pnpm install
pnpm build     # compila todos los paquetes
pnpm lint      # ESLint
pnpm test      # Vitest
```

Documentación del proyecto: `PROJECT.md`, `ENGINEERING.md`, `PROJECT_STATE.md`, `ARCHITECTURE_DECISIONS.md` .
