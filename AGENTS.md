# AGENTS.md — Email IA

## 1. Lectura obligatoria por sesión (orden estricto)

Antes de tocar código, leer en este orden:

1. `PROJECT.md` — objetivo y filosofía Desktop First (Electron contenedor).
2. `ENGINEERING.md` — stack, estándares, Git, convenciones SOLID/DRY/YAGNI.
3. `AI_CONSTITUTION.md` — calidad > velocidad, nunca romper arquitectura.
4. `PROJECT_STATE.md` — fase actual, backlog, hallazgos, riesgos, próxima tarea.
5. `DEVELOPMENT_WORKFLOW.md` — flujo 9 pasos por sesión (planificar → implementar → lint/tests → actualizar estado → commit).
6. `ARCHITECTURE_DECISIONS.md` + `docs/adr/ADR-*.md` — D1-D10 y ADRs 001-008 (nunca modificar historial).

Si hay conflicto: `AGENTS.md` proyecto > `~/.config/opencode/AGENTS.md` global > conocimiento modelo.

## 2. Harness — MCP + Skills (sinergia obligatoria)

El agente DEBE usar MCP y skills de forma sinérgica en cada tarea. Matriz por fase de `DEVELOPMENT_WORKFLOW.md`:

| Fase workflow                                                | MCP a usar                                   | Skills a cargar                                                                                          | Cuándo es obligatorio                                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Analizar contexto / proponer arquitectura / refactorizar** | `codebase-memory`                            | `codebase-memory` + `clean-ddd-hexagonal` + `hexagonal-email-ia` (local)                                 | Antes de mover/crear archivos o ports. `search_graph`/`trace_path` primero, no asumir.                                                             |
| **Planificar tarea**                                         | —                                            | `writing-plans` + `brainstorming` (+ `executing-plans` al ejecutar)                                      | Toda tarea >3 pasos o con bloqueos. Si hay bloqueos, no comenzar implementación.                                                                   |
| **Implementar — TypeScript / pnpm / tooling**                | `context7` (resolve-library-id → query-docs) | `typescript-core` + `antfu` + `ponytail` (full)                                                          | Al tocar `tools/tsconfig`, `pnpm-workspace.yaml`, deps, o elegir librería. `ponytail` activo cada respuesta (lite/full/ultra).                     |
| **Implementar — Backend / hexagonal**                        | `codebase-memory` + `context7`               | `hexagonal-email-ia` (local) + `clean-ddd-hexagonal` + `clean-code` + `ponytail`                         | Al tocar `packages/core                                                                                                                            | db  | ai-provider | backend | shared | electron`. Port first + DI obligatorio. |
| **Implementar — DB / migraciones**                           | `context7` (Drizzle/libSQL)                  | `drizzle` + `drizzle-migrations` + `hexagonal-email-ia`                                                  | Al tocar `packages/db` schema/migrate/repositories.                                                                                                |
| **Implementar — Frontend UI5**                               | `context7` (UI5)                             | `sapui5-email-ia` (local) + `sapui5` (global)                                                            | Al tocar `packages/frontend` (Component/manifest/view/controller/model/service).                                                                   |
| **Implementar — Observabilidad (Fase 3B)**                   | `context7`                                   | `opentelemetry` + `clean-code`                                                                           | Al tocar logging Pino, OTel SDK, health checks.                                                                                                    |
| **Implementar — API docs**                                   | `context7`                                   | `api-documentation`                                                                                      | Al tocar OpenAPI/Scalar.                                                                                                                           |
| **Testing — unit/integration**                               | —                                            | `vitest` + `test-driven-development` (TDD red→green→refactor) + `verification-before-completion`         | Siempre. Test rojo primero, nunca reverse-engineer código ya verde. Cobertura ≥80% `vitest.config.ts:24`.                                          |
| **Testing — E2E / visual**                                   | `playwright` (CDP :9222)                     | `playwright` + `playwright-best-practices` + `webapp-testing` + `playwright-testing` + `sapui5-email-ia` | Antes de declarar done cualquier UI. No basta `ui5 build` OK. `browser_navigate`→`snapshot`→`console_messages`→`network_requests`.                 |
| **Debugging**                                                | —                                            | `systematic-debugging`                                                                                   | Ante fallo: observar → hipotetizar → probar → verificar. No edits aleatorios.                                                                      |
| **Calidad / Lint**                                           | `eslint` (`@eslint/mcp`)                     | `clean-code` + `ponytail-review` (si disponible)                                                         | Antes de commit. `pnpm lint` + `pnpm format:check` verdes.                                                                                         |
| **Git / commits / PRs**                                      | `github`                                     | `git-workflow` + `finishing-a-development-branch` + `ponytail`                                           | Commit Conventional Commits (`commitlint`), ramas `main→develop→feature/*`, PR con checks `quality` + `gitleaks` + `CodeQL`. Nunca `main` directo. |
| **Paralelizar trabajo**                                      | —                                            | `dispatching-parallel-agents` + `subagent-driven-development`                                            | Sub-tareas independientes (ej: tests + impl en paralelo).                                                                                          |
| **Documentar / ADR**                                         | —                                            | `writing-skills` (si crea skill)                                                                         | Toda decisión arquitectónica nueva → `docs/adr/ADR-xxx.md` + `docs/harness.md` si toca harness.                                                    |

**Reglas de sinergia (estricto, cada sesión):**

1. **TDD primero:** `test-driven-development` — escribir test que falle → impl mínima → verificar → refactor. `verification-before-completion` antes de marcar done.
2. **Nunca asumir arquitectura:** `codebase-memory` + `clean-ddd-hexagonal`/`hexagonal-email-ia` antes de crear/mover código. Respetar dependency rule `shared←core←db|ai-provider←backend←electron` (ADR-001/002/003).
3. **No depender de conocimiento interno para APIs:** `context7` `resolve-library-id` → `query-docs` para toda lib/framework/SDK (UI5, Drizzle, Vitest, Pino, OTel, etc.).
4. **Playwright no es opcional:** ninguna feature UI se declara completa solo porque compila o pasan unit tests (`playwright-testing` + `sapui5-email-ia`).
5. **Ponytail activo por defecto (full):** `ponytail` — YAGNI, 1 línea antes que 50, stdlib antes que dependencia, cuestionar si la tarea debe existir. Modos `lite|full|ultra`, off solo `stop ponytail`.
6. **Mínima modificación:** tocar solo lo necesario; nada de refactors cosméticos no solicitados. Validar antes de cerrar: compilar, tests en verde, sin regresión.
7. **Git requiere autorización:** toda mutación `commit/push/PR` con permiso usuario y flujo `develop→main` con ADR si aplica.

## 3. Arquitectura

- Hexagonal + Shared Kernel (referencia `odata-server` + `node-modular-monolith-skill`). Ver skill local `hexagonal-email-ia` para mapa de paquetes y ports canónicos (`AIProviderPort`, `SecretStorePort`, `ModelManagerPort`, `AppError`/`ProviderError`/`DbError`).
- Electron es solo contenedor; el Core no depende de él (`packages/electron` usa `vite-plugin-electron@0.28.8` + `vite@6.3.5`, `preload.cjs` para `sandbox:true`).
- Monorepo pnpm custom (`pnpm-workspace.yaml`, `allowBuilds: {electron:true, esbuild:true, better-sqlite3:false}`), Node 22 LTS (`.nvmrc`).

## 4. Comandos

| Comando                                  | Descripción                                   |
| ---------------------------------------- | --------------------------------------------- |
| `pnpm install`                           | Instala dependencias del workspace            |
| `pnpm build`                             | Compila todos los paquetes (orden topológico) |
| `pnpm typecheck`                         | Typecheck de todos los paquetes               |
| `pnpm lint` / `pnpm lint:fix`            | ESLint (flat config, root)                    |
| `pnpm test` / `pnpm test:watch`          | Vitest                                        |
| `pnpm test:coverage`                     | Vitest con cobertura (umbral mínimo 80%)      |
| `pnpm format` / `pnpm format:check`      | Prettier                                      |
| `pnpm --filter @email-ia/frontend build` | `ui5 build --all` (frontend)                  |
| `pnpm --filter @email-ia/frontend start` | `ui5 serve :8080` (frontend)                  |

## 5. Reglas transversales

- Commits: Conventional Commits (forzado por commitlint vía Husky + `git-workflow`).
- Nunca romper arquitectura, saltar capas, duplicar lógica ni generar código muerto (`AI_CONSTITUTION.md`).
- No exponer secretos; config solo vía variables de entorno (`SecretStorePort` → Keytar/Env, SQLCipher).
- Rama `main` protegida (flujo: `main` → `develop` → `feature/*` + `hotfix/*`/`release/*`, PR obligatorio con checks `quality`/`gitleaks`/`CodeQL`).
- Harness vivo: catálogo en `docs/harness.md`, decisión en `docs/adr/ADR-008.md`. Toda nueva skill/MCP debe registrarse allí.

## 6. Skills y MCP instalados (resumen)

- **MCP:** `codebase-memory` (local), `context7` (remote), `github` (remote, `GITHUB_PERSONAL_ACCESS_TOKEN`), `playwright` (local CDP 9222), `eslint` (local `@eslint/mcp`).
- **Skills globales** (`~/.config/opencode/skills/`): `ponytail`, `vitest`, `sapui5`, `context7-mcp`, `antfu`, `typescript-core`, `drizzle`, `drizzle-migrations`, `clean-ddd-hexagonal`, `clean-code`, `git-workflow`, `github-actions`, `opentelemetry`, `api-documentation`, `playwright`, `playwright-best-practices`, `playwright-cli`, `webapp-testing`, `test-driven-development`, `verification-before-completion`, `systematic-debugging`, `writing-plans`, `executing-plans`, `brainstorming`, `dispatching-parallel-agents`, `subagent-driven-development`, `finishing-a-development-branch`, `requesting-code-review`, `using-git-worktrees`, `playwright-testing` + vercel skills.
- **Skills locales** (`.opencode/skills/`): `sapui5-email-ia`, `hexagonal-email-ia`.
- Detalle y sinergia: `docs/harness.md:1`.
