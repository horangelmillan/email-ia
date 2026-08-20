# PROJECT STATE

## Estado General

Fase: 1 — Fundación técnica (EN CURSO)

Estado: Scaffolding del monorepo completado y verificado (lint, typecheck, build, test en verde). Siguiente: spike técnico Electron ↔ Web + runtime IA.

Última actualización: 2026-08-19

---

# Progreso

## Backend

- [x] Stack decidido: Node.js + Express, hexagonal + Shared Kernel (referencias: odata-server, node-modular-monolith-skill)
- [x] Logging (Pino), configuración (dotenv + zod), error handling unificado, health checks decididos
- [x] Scaffolding del paquete `backend` (workspace @email-ia/backend)
- [ ] Lógica real del backend (Express, adapters) — Fase 2

## Frontend

- [x] SAPUI5 (MVC) + UI5 CLI v4 decidido
- [x] UI Component Playground + regresión visual (Playwright) decididos
- [x] Scaffolding del paquete `frontend` (placeholder; build/typecheck echo)
- [ ] Bootstrap de la app SAPUI5 con UI5 CLI v4 (routing, models, services) — Fase 2

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
- [ ] Activar branch protection cuando exista remoto; evaluar CodeQL

---

# Backlog

## Alta

- Fase 1 — Spike técnico: validar reutilización Electron ↔ Web y runtime de IA embebido (próxima tarea)
- Fase 2 — Arquitectura base: hexagonal + Shared Kernel en `packages/core`, AIProviderPort en `packages/ai-provider`
- Fase 2 — Capa de BD (Drizzle + migraciones + SQLCipher + almacén seguro del SO)
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

---

# Riesgos

| Riesgo                                                      | Probabilidad | Impacto | Mitigación                                                       |
| ----------------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------- |
| Reutilización Electron ↔ Web no validada en código          | Media        | Alto    | Spike técnico temprano en Fase 1                                 |
| Testing IA no determinístico                                | Alta         | Alto    | Evals + golden dataset (§3.7)                                    |
| Runtime embebido (llama.cpp/llamafile) con binarios nativos | Media        | Medio   | Spike en Fase 1; adaptadores alternativos (Ollama/LM Studio)     |
| Secrets en repo (credenciales email)                        | Media        | Crítico | Secret scanning + .gitignore estricto + secrets solo por entorno |
| UI5 CLI v5 (en desarrollo) rompe build futuro               | Baja         | Medio   | Monitorear releases; migración planificada                       |

---

# Bloqueadores

- Ninguno. La definición está completa y no impide iniciar la Fase 1.

---

# Próxima tarea

- Fase 1 — Spike técnico: validar reutilización Electron ↔ Web y runtime de IA embebido (llama.cpp/llamafile vs LM Studio).

---

# Commits pendientes

- Commit de scaffolding Fase 1 (monorepo, tools, quality gates, CI): paquetes, configs raíz, AGENTS.md, README, .github. Mensaje: `feat: scaffolding monorepo fase 1` (incluye normalización de formato Prettier de la documentación).

---

# Notas

- Decisiones D1-D10 resueltas (2026-08-19). Detalle en ARCHITECTURE_DECISIONS.md y ADR-001/ADR-002.
- Proceso de ADR formalizado: numeración secuencial, nunca modificar historial, decisiones sustituidas referenciadas por ADR nuevos.
- ENGINEERING.md y PROJECT.md no requieren cambios; sus referencias a "plantilla oficial" se interpretan según §4 de ARCHITECTURE_DECISIONS.md (repositorios de referencia, no plantillas rígidas).
