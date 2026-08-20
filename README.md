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
  core/          # Shared Kernel + Domain (núcleo hexagonal)
  backend/       # Express + adapters (HTTP, DB, Email, AI)
  frontend/      # App SAPUI5 (pendiente Fase 2)
  electron/      # Main + Preload (pendiente Fase 2)
  ai-provider/   # Puerto hexagonal AI + adapters
  db/            # Capa de BD (Drizzle + migraciones)
  shared/        # Types, utils, constantes, schemas
tools/
  eslint-config/ # Config ESLint compartida
  tsconfig/      # Config TypeScript compartida
  prettier-config/
docs/adr/        # Decisiones arquitectónicas (ADR-001, ADR-002)
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

Documentación del proyecto: `PROJECT.md`, `ENGINEERING.md`, `PROJECT_STATE.md`, `ARCHITECTURE_DECISIONS.md`.
