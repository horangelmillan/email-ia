# Harness — MCP + Skills (Email IA)

> Catálogo vivo del entorno de desarrollo asistido con IA. Actualizar en cada instalación/cambio de MCP/skill. Decisión: `ADR-008`.

## 1. MCP (Model Context Protocol)

| MCP                 | Tipo   | Paquete / URL                                                                       | Estado         | Cuándo usar                                                     | Regla                                                                                                                               |
| ------------------- | ------ | ----------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **codebase-memory** | local  | `C:/Users/Horan/AppData/Local/Programs/codebase-memory-mcp/codebase-memory-mcp.exe` | `enabled:true` | Antes de proponer arquitectura, refactorizar, crear feature     | `search_graph`/`trace_path` primero; no asumir lo recuperable del grafo                                                             |
| **context7**        | remote | `https://mcp.context7.com/mcp`                                                      | `enabled:true` | Toda lib/framework/SDK (UI5, Drizzle, Vitest, Pino, OTel, etc.) | `resolve-library-id` → `query-docs`, nunca conocimiento interno para APIs                                                           |
| **github**          | remote | `https://api.githubcopilot.com/mcp/` (`GITHUB_PERSONAL_ACCESS_TOKEN`)               | `enabled:true` | PRs, issues, reviews, búsqueda código, checks                   | Buscar plantillas PR antes de crear; nunca cerrar issue sin `state_reason`; respetar `main→develop→feature/*`                       |
| **playwright**      | local  | `npx @playwright/mcp@latest --cdp-endpoint http://localhost:9222`                   | `enabled:true` | Validación visual/funcional navegador                           | Cargar skill `playwright-testing`/`sapui5-email-ia` + `playwright-best-practices` antes; nunca declarar UI done solo porque compila |
| **eslint**          | local  | `npx @eslint/mcp@latest`                                                            | `enabled:true` | Lint asistido, flat config, autofix                             | Complementa `pnpm lint`/`eslint.config.js`; usar para quick-fix antes de commit                                                     |

**Config:** `~/.config/opencode/opencode.jsonc:3`.

## 2. Skills globales (`~/.config/opencode/skills/` y `~/.agents/skills/`)

> Instaladas vía `npx skills add <repo> --skill <name> -g -y` (source `~/.agents/skills`, copiadas a `~/.config/opencode/skills` para OpenCode). Ver `npx skills list -g`.

| Skill                              | Repo                                              | Versión / fecha              | Para qué en Email IA                                                                                         | Fase harness                                       |
| ---------------------------------- | ------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **ponytail**                       | `dietrichgebert/ponytail`                         | 112K stars, 45K installs     | Minimalismo YAGNI: 1 línea antes que 50, stdlib antes que dep, cuestionar si tarea debe existir. Modos `lite | full                                               | ultra` | Toda tarea, cada respuesta (`AGENTS.md:2` sinergia 5) |
| **vitest**                         | `antfu/skills:vitest`                             | 2026-06-22 Vitest 5.x        | Config, CLI, test/describe API, coverage v8, mocks                                                           | Testing unit/integration `vitest.config.ts:24` 80% |
| **sapui5**                         | `secondsky/sap-skills:sapui5`                     | 2.4.0, 2026-05-31, UI5 1.148 | SAPUI5 genérica (Fiori, OData v2/v4, mdc, QUnit/OPA5)                                                        | Complementa `sapui5-email-ia` local                |
| **context7-mcp**                   | `local:context7-mcp`                              | —                            | Guía uso MCP context7                                                                                        | Al resolver docs                                   |
| **antfu**                          | `antfu/skills:antfu`                              | —                            | Conventions TS+ESM+pnpm catalog                                                                              | Tooling `tools/tsconfig`, `pnpm-workspace.yaml`    |
| **typescript-core**                | `bobmatnyc/claude-mpm-skills:typescript-core`     | —                            | Strict config, Zod boundaries, `noUncheckedIndexedAccess`                                                    | TS strict `tools/tsconfig/base.json`               |
| **drizzle**                        | `bobmatnyc/claude-mpm-skills:drizzle`             | —                            | Schema/queries type-safe, libSQL/pg                                                                          | `packages/db` schema                               |
| **drizzle-migrations**             | `bobmatnyc/claude-mpm-skills:drizzle-migrations`  | —                            | `drizzle.config.ts`, generate/migrate/push, conflictos                                                       | `packages/db` migraciones                          |
| **clean-ddd-hexagonal**            | `ccheney/robust-skills:clean-ddd-hexagonal`       | 212 líneas                   | Sintetiza Hexagonal+DDD+Clean+Onion+CQRS, dependency inward                                                  | Arquitectura `packages/core→db→backend`            |
| **clean-code**                     | `davila7/claude-code-templates:clean-code`        | 852 skills repo              | SRP/DRY/KISS/YAGNI, naming                                                                                   | Calidad gral `AI_CONSTITUTION.md`                  |
| **git-workflow**                   | `bobmatnyc/claude-mpm-skills:git-workflow`        | —                            | Conventional Commits, branching, stacked PRs                                                                 | Git `ENGINEERING.md:74`                            |
| **github-actions**                 | `bobmatnyc/claude-mpm-skills:github-actions`      | —                            | Workflows, caching, concurrency, `security-events:write`                                                     | CI `ci.yml`/`codeql.yml`                           |
| **opentelemetry**                  | `bobmatnyc/claude-mpm-skills:opentelemetry`       | —                            | Traces/metrics/logs, OTLP export                                                                             | Fase 3B OTel+Pino                                  |
| **api-documentation**              | `bobmatnyc/claude-mpm-skills:api-documentation`   | —                            | OpenAPI 3.1 + Scalar                                                                                         | API docs `ARCH §3.6`                               |
| **playwright**                     | `bobmatnyc/claude-mpm-skills:playwright`          | —                            | E2E patterns base                                                                                            | E2E `playwright.config.ts`                         |
| **playwright-best-practices**      | `currents-dev/playwright-best-practices-skill`    | —                            | Selectors/fixtures/parallelism/CI                                                                            | E2E hardening                                      |
| **playwright-cli**                 | `microsoft/playwright-cli`                        | —                            | Control live browser CLI record/inspect                                                                      | Debug E2E                                          |
| **webapp-testing**                 | `anthropics/skills:webapp-testing`                | —                            | Unit/integration/e2e stack completo                                                                          | Testing gral                                       |
| **test-driven-development**        | `obra/superpowers:test-driven-development`        | —                            | TDD red→green→refactor                                                                                       | Toda impl                                          |
| **verification-before-completion** | `obra/superpowers:verification-before-completion` | —                            | Gate de verificación antes de done                                                                           | Cierre tarea `DEVELOPMENT_WORKFLOW.md:78`          |
| **systematic-debugging**           | `obra/superpowers:systematic-debugging`           | —                            | Hipótesis→prueba→verifica                                                                                    | Debug                                              |
| **writing-plans**                  | `obra/superpowers:writing-plans`                  | —                            | Planes estructurados pre-impl                                                                                | Planificación                                      |
| **executing-plans**                | `obra/superpowers:executing-plans`                | —                            | Ejecución con checkpoints                                                                                    | Ejecución                                          |
| **brainstorming**                  | `obra/superpowers:brainstorming`                  | —                            | Ideación estructurada                                                                                        | Planificación                                      |
| **dispatching-parallel-agents**    | `obra/superpowers:dispatching-parallel-agents`    | —                            | Paralelizar subagentes                                                                                       | Tareas divisibles                                  |
| **subagent-driven-development**    | `obra/superpowers:subagent-driven-development`    | —                            | Orquestar subagentes especializados                                                                          | Tareas divisibles                                  |
| **finishing-a-development-branch** | `obra/superpowers:finishing-a-development-branch` | —                            | Checklist cierre rama: tests+commit+PR+review                                                                | Git cierre                                         |
| **requesting-code-review**         | `obra/superpowers:requesting-code-review`         | —                            | Preparar PR, self-review                                                                                     | Git PR                                             |
| **using-git-worktrees**            | `obra/superpowers:using-git-worktrees`            | —                            | Worktrees para sesiones paralelas                                                                            | Git paralelo                                       |
| **playwright-testing**             | local `playwright-testing`                        | 2026-07-30                   | Validación visual odata-server (migrar a Email IA)                                                           | E2E legacy                                         |

Vercel skills (`vercel-*`, `web-design-guidelines`, etc.) instaladas pero no canónicas Email IA — quedan disponibles, no listadas en `AGENTS.md:6`.

## 3. Skills locales (`.opencode/skills/`)

| Skill                  | Archivo                                        | Propósito                                                                                                                                       |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **sapui5-email-ia**    | `.opencode/skills/sapui5-email-ia/SKILL.md`    | Receta exacta `packages/frontend` UI5 CLI v4 1.133.0, routing `home/inbox`, Component/manifest/view/controller/model/service, `ui5 build/serve` |
| **hexagonal-email-ia** | `.opencode/skills/hexagonal-email-ia/SKILL.md` | Dependency rule `shared←core←db                                                                                                                 | ai-provider←backend←electron`, ports `AIProviderPort`/`SecretStorePort`/`ModelManagerPort`+`AppError`, DI obligatorio |

## 4. Sinergia por fase (resumen)

Ver `AGENTS.md:2` matriz completa. Principios:

1. **TDD primero** (`test-driven-development` + `vitest` + `verification-before-completion`).
2. **Nunca asumir arquitectura** (`codebase-memory` + `clean-ddd-hexagonal`/`hexagonal-email-ia`).
3. **Context7 para toda API externa** (`resolve-library-id` → `query-docs`).
4. **Playwright obligatorio** para UI (no basta `ui5 build`).
5. **Ponytail full por defecto** (`lite|full|ultra`, off solo `stop ponytail`).
6. **Mínima modificación**, validación `lint/typecheck/build/test:coverage` verde.
7. **Git con autorización** + `git-workflow` + Conventional Commits.

## 5. Instalación y mantenimiento

```bash
# Instalar skill global (ej)
npx skills add https://github.com/dietrichgebert/ponytail --skill ponytail -g -y
# Copia necesaria para OpenCode (skills CLI usa ~/.agents/skills)
Copy-Item -Path "$env:USERPROFILE\.agents\skills\ponytail" -Destination "$env:USERPROFILE\.config\opencode\skills\ponytail" -Recurse -Force

# Listar
npx skills list -g

# Actualizar
npx skills update -g -y
```

Toda nueva skill/MCP debe: (1) evaluarse en `skills.sh`, (2) registrarse aquí, (3) reflejarse en `AGENTS.md:2` matriz y `AGENTS.md:6` resumen, (4) si es decisión arquitectónica → `docs/adr/ADR-xxx.md`.

## 6. Historial

- 2026-08-27: Harness completo (ADR-008) — ponytail + 20+ skills globales + 2 locales + eslint MCP, `AGENTS.md` refactorizado con sinergia estricta.
