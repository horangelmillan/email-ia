# PROJECT STATE

## Estado General

Fase: 0 — Definición (CERRADA)

Estado: Definición completa y documentada. Decisiones D1-D10 resueltas y registradas en ADR-001/ADR-002. Listo para iniciar Fase 1 — Fundación técnica (scaffolding del monorepo).

Última actualización: 2026-08-19

---

# Progreso

## Backend

- [x] Stack decidido: Node.js + Express, hexagonal + Shared Kernel (referencias: odata-server, node-modular-monolith-skill)
- [x] Logging (Pino), configuración (dotenv + zod), error handling unificado, health checks decididos
- [ ] Scaffolding del paquete `backend` (pendiente Fase 1)

## Frontend

- [x] SAPUI5 (MVC) + UI5 CLI v4 decidido
- [x] UI Component Playground + regresión visual (Playwright) decididos
- [ ] Scaffolding del paquete `frontend` (pendiente Fase 1)

## IA

- [x] AI Provider desacoplado (multi-runtime: embebido por defecto, Ollama, LM Studio, OpenAI)
- [x] Gestor de modelos, RAG, prompts versionados con golden dataset, offline-first, SQLCipher decididos
- [ ] Puerto hexagonal AIProviderPort materializado en `packages/ai-provider` (pendiente Fase 2)

## Base de datos

- [x] SQLite + Drizzle/Drizzle Kit + SQLCipher decididos
- [ ] Migraciones iniciales y capa de BD (pendiente Fase 2)

## Integraciones

- [x] Proveedores objetivo: Gmail, Outlook, IMAP, sistema de archivos (definidos en PROJECT.md)
- [ ] Adaptadores de integración (pendiente Fase 2+)

## Testing

- [x] Vitest (backend/frontend), Supertest, Playwright, Pact + MSW, faker/factories decididos
- [~] Estrategia de testing IA (golden dataset/evals definida en §3.7; materializar en Fase 2)
- [ ] Configuración real de Vitest/Playwright (pendiente Fase 1)

## Seguridad

- [x] Helmet, CORS, Compression; secrets solo por entorno; secret scanning decididos
- [x] Cifrado en reposo con SQLCipher + claves en almacén seguro del SO decididos
- [ ] Implementación (pendiente Fase 1+)

## CI/CD

- [x] CI (lint, typecheck, test, build), dependabot, npm audit + CodeQL (evaluar), Gitleaks/TruffleHog, branch protection main/dev decididos
- [x] CD: solo local por ahora (sin destino de despliegue)
- [ ] Workflows GitHub Actions (pendiente Fase 3)

---

# Backlog

## Alta

- Fase 1 — Fundación técnica: scaffolding monorepo custom (packages: core, backend, frontend, electron, ai-provider, db, shared; tools: eslint-config, tsconfig, prettier-config)
- Fase 1 — pnpm workspace, `.nvmrc`/engines (última LTS estable), tsconfig base con aliases @, EditorConfig
- Fase 1 — ESLint/Prettier (overrides frontend/backend), Husky + lint-staged, commitlint (Conventional Commits), Quality Gates (coverage 80%)
- Fase 1 — Vitest base (backend/frontend) y Playwright config (e2e, visual regression, trace)
- Fase 1 — Spike técnico: validar reutilización Electron ↔ Web y runtime de IA embebido
- Fase 1 — CI pipeline inicial (lint, typecheck, test, build)

## Media

- Fase 2 — Arquitectura base: hexagonal + Shared Kernel en `packages/core`, AIProviderPort en `packages/ai-provider`
- Fase 2 — Capa de BD (Drizzle + migraciones + SQLCipher + almacén seguro del SO)
- Fase 2 — UI5 CLI v4: bootstrap de la app SAPUI5, routing, models, services
- Fase 3 — CI/CD GitHub Actions, dependabot, CodeQL, secret scanning, branch protection

## Baja

- Fase 4 — Observabilidad: instrumentación OTel activable por configuración, health checks
- Fase 4+ — Contrato de integraciones Gmail/Outlook/IMAP (Pact), adaptadores
- Fase 4+ — Runbooks operativos
- Futuro — Reevaluar Nx/Turborepo, Loki/Tempo o SaaS si hay destino de despliegue

---

# Hallazgos

- UI5 Tooling fue renombrado a **UI5 CLI v4** (2025): el build "webpack estándar" ya no es la base oficial; Vite sigue siendo middleware comunitario. La tabla de decisiones original estaba desactualizada.
- La tabla de decisiones (§6) no reflejaba las respuestas ya dadas en §3 (desincronización corregida el 2026-08-19).
- Las referencias a "plantillas oficiales" inexistentes (hexagonal/SAPUI5) se resolvieron con repositorios de referencia: odata-server + node-modular-monolith-skill (backend) y SmartInventory-frontend (frontend, copia local).

---

# Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Reutilización Electron ↔ Web no validada en código | Media | Alto | Spike técnico temprano en Fase 1 |
| Testing IA no determinístico | Alta | Alto | Evals + golden dataset (§3.7) |
| Runtime embebido (llama.cpp/llamafile) con binarios nativos | Media | Medio | Spike en Fase 1; adaptadores alternativos (Ollama/LM Studio) |
| Secrets en repo (credenciales email) | Media | Crítico | Secret scanning + .gitignore estricto + secrets solo por entorno |
| UI5 CLI v5 (en desarrollo) rompe build futuro | Baja | Medio | Monitorear releases; migración planificada |

---

# Bloqueadores

- Ninguno. La definición está completa y no impide iniciar la Fase 1.

---

# Próxima tarea

- Fase 1 — Scaffolding del monorepo: estructura de carpetas, pnpm workspace, tsconfig base, EditorConfig, ESLint/Prettier, Husky + lint-staged + commitlint, Vitest base.

---

# Commits pendientes

- Commit de cierre de definición: ARCHITECTURE_DECISIONS.md (sincronizado), ADR-001, ADR-002, PROJECT_STATE.md. Mensaje: `docs: cerrar fase de definicion` (incluye renombrado de rama master → main).

---

# Notas

- Decisiones D1-D10 resueltas (2026-08-19). Detalle en ARCHITECTURE_DECISIONS.md y ADR-001/ADR-002.
- Proceso de ADR formalizado: numeración secuencial, nunca modificar historial, decisiones sustituidas referenciadas por ADR nuevos.
- ENGINEERING.md y PROJECT.md no requieren cambios; sus referencias a "plantilla oficial" se interpretan según §4 de ARCHITECTURE_DECISIONS.md (repositorios de referencia, no plantillas rígidas).