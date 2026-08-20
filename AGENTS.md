# AGENTS.md — Email IA

## Reglas del proyecto

- Leer antes de actuar: `PROJECT.md`, `ENGINEERING.md`, `AI_CONSTITUTION.md`, `PROJECT_STATE.md`, `DEVELOPMENT_WORKFLOW.md`, `ARCHITECTURE_DECISIONS.md` y `docs/adr/`.
- Seguir estrictamente el flujo de `DEVELOPMENT_WORKFLOW.md` en cada sesión.
- Respetar las decisiones registradas en `docs/adr/`; toda decisión arquitectónica nueva requiere ADR.
- Arquitectura hexagonal + Shared Kernel (referencia: repositorios `odata-server` y `node-modular-monolith-skill`). Electron es solo contenedor; el Core no depende de él.

## Comandos

| Comando                             | Descripción                                   |
| ----------------------------------- | --------------------------------------------- |
| `pnpm install`                      | Instala dependencias del workspace            |
| `pnpm build`                        | Compila todos los paquetes (orden topológico) |
| `pnpm typecheck`                    | Typecheck de todos los paquetes               |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (flat config, root)                    |
| `pnpm test` / `pnpm test:watch`     | Vitest                                        |
| `pnpm test:coverage`                | Vitest con cobertura (umbral mínimo 80%)      |
| `pnpm format` / `pnpm format:check` | Prettier                                      |

## Reglas transversales

- Commits: Conventional Commits (forzado por commitlint vía Husky).
- Nunca romper arquitectura, saltar capas, duplicar lógica ni generar código muerto.
- No exponer secretos; config solo vía variables de entorno.
- Rama `main` protegida (flujo: `main` → `develop` → `feature/*`).
