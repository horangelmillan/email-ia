# ARCHITECTURE DECISIONS & TECHNICAL GAPS

> Documento vivo para decisiones arquitectónicas y seguimiento de vacíos técnicos.
> **Instrucción**: Responde cada ítem **debajo de la línea `--- RESPUESTA ---`** correspondiente.

---

## 1. INCONSISTENCIAS DETECTADAS

| # | Inconsistencia | Archivos Afectados | Impacto |
|---|----------------|-------------------|---------|
| 1 | Referencia a "plantilla oficial Hexagonal + Shared Kernel" que **no existe** | PROJECT.md:38, ENGINEERING.md:6-9 | **Bloqueador**: no hay base para implementar backend |
| 2 | Referencia a "plantilla oficial SAPUI5" que **no existe** | PROJECT.md:27-33, ENGINEERING.md:15-19 | **Bloqueador**: no hay base para implementar frontend |
| 3 | PROJECT.md menciona SQLite; ENGINEERING.md no especifica BD | PROJECT.md:41, ENGINEERING.md | Riesgo: decisiones de persistencia no alineadas |
| 4 | PROJECT.md define "AI Provider" desacoplado; ENGINEERING.md no menciona testing de IA | PROJECT.md:46, ENGINEERING.md:39-49 | Hueco: sin estrategia de testing para componentes de IA |
| 5 | ENGINEERING.md especifica Supertest/Playwright; PROJECT.md no define estrategia de testing | ENGINEERING.md:43-49 | Desalineación: testing definido solo en ENGINEERING |

---

## 2. INFORMACIÓN DUPLICADA (Candidatas a centralizar)

| Concepto | Dónde aparece | Recomendación |
|----------|---------------|---------------|
| Arquitectura Hexagonal | PROJECT.md:38, ENGINEERING.md:5-9 | Centralizar en `ARCHITECTURE.md` |
| SAPUI5 / MVC | PROJECT.md:27-33, ENGINEERING.md:15-19 | Centralizar en `ARCHITECTURE.md` |
| TypeScript | PROJECT.md (implícito), ENGINEERING.md:27 | Centralizar en `TECH_STACK.md` |
| Principios SOLID/Clean Code | PROJECT.md:58-62, ENGINEERING.md:105-110 | Centralizar en `CODING_STANDARDS.md` |

---

## 3. VACÍOS CRÍTICOS (Hardness Engineering)

> **Marca con `[x]` los completados, `[~]` en progreso, `[ ]` pendientes. Añade notas bajo `--- NOTA ---`.**

### 3.1 Infraestructura Base
- [x] **Package manager** no definido (npm/yarn/pnpm)
- [x] **Node.js version** no especificada
- [x] **Monorepo vs Polyrepo** no decidido
- [x] **TypeScript config** (tsconfig.base.json, paths, strictness)
- [x] **EditorConfig** ausente

--- RESPUESTA ---

**Package manager** no definido (npm/yarn/pnpm): Vamos a usar todo el ecocistema con "pnpm", la idea es evitar riesgos de seguridad que ultimamente se han venido presentando con "npm", investigar exhaustivamente todas las buenas practicas de seguridad sugeridas con pnpm, documentarlas como reglas de desarrollo e implementarlas.

**Node.js version** no especificada: utilizar la ultima version estable

**Monorepo vs Polyrepo** no decidido: monorepo

**TypeScript config** (tsconfig.base.json, paths, strictness): utilizar las mejores practicas de configuracion de TypeScript para usar ES6 module, investigar exhaustivamente las mejores practicas, utiliza aliases con @ para facilitar la lectura de rutas.

**EditorConfig** ausente: Configurar optimamente todos los necesarios para OpenCode, VSCode, githu, investigar exhaustivamente las mejores practicas.

### 3.1 Infraestructura Base


--- NOTA ---


### 3.2 Calidad Automatizada
- [x] **ESLint config** (reglas, plugins, overrides frontend/backend)
- [x] **Prettier config** (opciones, ignore patterns)
- [x] **Husky + lint-staged** configuración real
- [x] **Conventional Commits** enforcement (commitlint)
- [x] **Quality Gates** definidos (coverage thresholds por capa)

--- RESPUESTA ---

**ESLint config** (reglas, plugins, overrides frontend/backend): Investigar exhaustivamente las mejores practicas de ESLint para poryectos de Node con TypeScript y SAPUI5

**Prettier config** (opciones, ignore patterns): investigar las mejores practicas actuales e implementar

**Husky + lint-staged** configuración real: investigar las mejores practicas actuales e implementar

**Conventional Commits** enforcement (commitlint): investigar las mejores practicas actuales e implementar

**Quality Gates** definidos (coverage thresholds por capa): investigar las mejores practicas actuales e implementar, debe cumplir con los requisitos minimos aceptables, pasar test, calidad de codigo, fase completa al 100%, etc

### 3.2 Calidad Automatizada


--- NOTA ---


### 3.3 Testing
- [x] **Vitest config** (backend: environment, globals, coverage)
- [x] **Vitest config** (frontend: SAPUI5, UI5 tooling integration)
- [x] **Playwright config** (e2e, visual regression, trace)
- [x] **Contract testing** strategy (Pact? MSW?)
- [x] **Test data/fixtures** strategy
- [~] **AI/LLM testing** strategy (determinismo, mocks, evals)

--- RESPUESTA ---

**Vitest config** (backend: environment, globals, coverage): investigar las mejores practicas actuales e implementar

**Vitest config** (frontend: SAPUI5, UI5 tooling integration): investigar las mejores practicas actuales e implementar

**Playwright config** (e2e, visual regression, trace): investigar las mejores practicas actuales e implementar, hacer uso estricto de MCP instalado en OpenCode de playwrigth mcp, documentar como regla estricta del desarrollo

**Contract testing** strategy (Pact? MSW?): Usar los dos (Pact? MSW?), investigar las mejores practicas actuales e implementar

**Test data/fixtures** strategy: usarlo en momentos que suene mas util, utilizar faker y estrategias factories, investigar las mejores practicas actuales e implementar

### 3.3 Testing


--- NOTA ---


### 3.4 CI/CD & GitHub Actions
- [x] **Pipeline CI** (lint, typecheck, test, build)
- [x] **Pipeline CD** (release, publish, deploy)
- [x] **Dependabot/Renovate** config
- [x] **Security Scanning** (CodeQL, Trivy, npm audit)
- [x] **Secret Scanning** (GitLeaks, TruffleHog)
- [x] **Branch protection rules** definidos

--- RESPUESTA ---

**Pipeline CI** (lint, typecheck, test, build): investigar las mejores practicas actuales e implementar

**Pipeline CD** (release, publish, deploy): aun no hay donde desplegar, por ahora solo vamos a correr de forma local

**Dependabot/Renovate** config: con dependabot, investigar las mejores practicas actuales e implementar.

**Security Scanning** (CodeQL, Trivy, npm audit): me parece que con npm audit es suficiente, pero podriamos añadir CodeQL para probar si no añade mucha complejidad, investigar las mejores practicas actuales e implementar

**Secret Scanning** (GitLeaks, TruffleHog): que que GitLeaks esta bien pero si TruffleHog no añade compejidad podriamos priorizar este, investigar las mejores practicas actuales e implementar

**Branch protection rules** definidos: si manteniendo un flujo git decente, la rama main es protegida y dev tambien, no se puede hacer merge si no es con un PR, dev parte de main y los cambios deben partir de dev, al terminar una fase se hacen pasan todos los criterios de aceptacion y se hace pr de main, se sincronizan main y dev para seguir trabajando, documentar como regla de desarrollo.

### 3.4 CI/CD & GitHub Actions


--- NOTA ---


### 3.5 Observabilidad & Operación
- [x] **Logging framework** (winston/pino, structured, levels)
- [x] **Error handling** unificado (AppError, codes, mapping HTTP)
- [x] **Configuration** (dotenv, zod validation, environments)
- [x] **OpenTelemetry** (traces, metrics, logs)
- [x] **Health checks** / readiness probes

--- RESPUESTA ---

**Logging framework** (winston/pino, structured, levels): Pino, investigar las mejores practicas actuales e implementar

**Error handling** unificado (AppError, codes, mapping HTTP): investigar las mejores practicas actuales e implementar, yo conozco el global error handling, pero igual investiga la mejor practica para el proyecto.

**Configuration** (dotenv, zod validation, environments): dotenv, zod validation, y enviroments usa todo, investigar las mejores practicas actuales e implementar

**OpenTelemetry** (traces, metrics, logs): investigar las mejores practicas actuales e implementar

**Health checks** / readiness probes: investigar las mejores practicas actuales e implementar

### 3.5 Observabilidad & Operación


--- NOTA ---


### 3.6 Arquitectura & Estructura
- [x] **Folder architecture** (monorepo structure, packages, boundaries)
- [x] **Database migrations** tool (Kysely, Drizzle, Prisma, raw SQL)
- [x] **API Documentation** (OpenAPI/Swagger, scalar, redoc)
- [x] **Shared Kernel** contracts definition
- [x] **AI Provider Interface** (ports/adapters para LLM local)
- [x] **Electron build** (electron-builder, forge, vite plugin)

--- RESPUESTA ---

**Folder architecture** (monorepo structure, packages, boundaries): vamos a usar como referencia o plantilla este proyecto que es mio: "https://github.com/horangelmillan/odata-server", y tambien vamos a utilizar una skill que use en base a ese mismo proyecto: "https://github.com/horangelmillan/node-modular-monolith-skill", viendo este enfoque podriamos tener ya preparado una arquitectura, estructura de carpetas y filosofia a respetar

**Database migrations** tool (Kysely, Drizzle, Prisma, raw SQL): mejor drezzly + drezzly kit, investigar las mejores practicas actuales e implementar

**API Documentation** (OpenAPI/Swagger, scalar, redoc): escalar mejor, investigar las mejores practicas actuales e implementar.

**Shared Kernel** contracts definition: el contraste lo puedes encontrar en "https://github.com/horangelmillan/odata-server" y la skill "https://github.com/horangelmillan/node-modular-monolith-skill"

**AI Provider Interface** (ports/adapters para LLM local): que sea versatil en ese aspecto, que se pueda configurar cualquier proveedor o interfaz se LLM o uno de red.

**Electron build** (electron-builder, forge, vite plugin):

vite-plugin-electron → para desarrollar.
electron-builder → para distribuir.
investigar las mejores practicas actuales e implementar.

### 3.6 Arquitectura & Estructura


--- NOTA ---


### 3.7 IA / LLM Local
- [x] **Model runtime** selection (llama.cpp, ollama, llamafile, Transformers.js)
- [x] **Model management** (download, version, quantization, updates)
- [x] **Embedding strategy** (RAG para emails, modelo, chunking)
- [x] **Prompt engineering** framework (templates, versioning, evaluation)
- [x] **Offline-first** sync strategy (incremental, conflict resolution)
- [x] **Data encryption** at rest (SQLCipher, encryption keys management)

--- RESPUESTA ---

**Model runtime** selection (llama.cpp, ollama, llamafile, Transformers.js): La aplicación no debe depender de un runtime específico. Debe permitir utilizar diferentes runtimes y modelos sin modificar la lógica de negocio. Siempre que sea posible, el usuario no debería instalar software adicional. Podria empezar integrando llama.cpp p llamafile,La aplicación implementará una arquitectura de proveedores de IA (AI Provider) desacoplada. El runtime por defecto será configurable y la aplicación soportará múltiples adaptadores. Implementar un sistema de proveedores desacoplados mediante un AIProviderPort, permitiendo múltiples adaptadores (llama.cpp, Ollama, LM Studio, OpenAI, etc.). El runtime por defecto será embebido para minimizar dependencias externas, pero la aplicación podrá configurarse para utilizar otros proveedores cuando el usuario lo desee. (para las pruebas podemos usar LLM studio mientras tanto pero debe estar configurado y todo listo para integrar otros proveedores)

**Model management** (download, version, quantization, updates): Implementar un gestor propio de modelos independiente del runtime. Debe permitir descargar, importar, versionar, actualizar y eliminar modelos, además de detectar automáticamente las cuantizaciones disponibles y recomendar la más adecuada según el hardware del usuario. La arquitectura debe abstraer estas operaciones mediante interfaces para que diferentes runtimes (llama.cpp, Ollama u otros) puedan integrarse sin afectar al resto de la aplicación.


**Embedding strategy** (RAG para emails, modelo, chunking): Definir la estrategia completa de RAG: extracción del contenido útil del correo (ignorando firmas y elementos repetitivos), generación de embeddings mediante un modelo especializado, almacenamiento en una base de datos vectorial, estrategia de chunking con solapamiento y actualización incremental cuando cambien los correos.


**Prompt engineering** framework (templates, versioning, evaluation): Implementar un sistema propio de gestión de prompts basado en plantillas versionadas. Los prompts deberán almacenarse como recursos independientes del código, soportar variables tipadas, versiones, metadatos y selección por modelo de IA. Incluir un sistema de evaluación con un conjunto de casos de prueba (golden dataset) para validar cambios antes de adoptarlos y evitar regresiones en la calidad de las respuestas.


**Offline-first** sync strategy (incremental, conflict resolution): Diseñar la aplicación para que la base de datos local sea la fuente principal de trabajo. Todas las operaciones deben funcionar sin conexión cuando sea posible. La sincronización con proveedores externos (correo, almacenamiento u otros servicios) deberá ser incremental, detectando únicamente cambios desde la última sincronización. Los conflictos deberán resolverse mediante una estrategia configurable según el tipo de dato (por ejemplo, prioridad al servidor para metadatos del correo y prioridad local para configuraciones del usuario), minimizando la intervención manual.

**Data encryption** at rest (SQLCipher, encryption keys management): Utilizar una base de datos cifrada mediante SQLCipher para proteger toda la información almacenada localmente. Las claves de cifrado no deberán almacenarse en la aplicación ni en archivos de configuración, sino en el almacén seguro del sistema operativo (DPAPI/Credential Manager en Windows, Keychain en macOS y Secret Service en Linux). El acceso a la base de datos deberá ser transparente para el usuario, manteniendo la protección frente a la copia o extracción del archivo de la base de datos.

### 3.7 IA / LLM Local


--- NOTA ---


### 3.8 Documentación Viva
- [x] **ADR** (Architecture Decision Records) template y proceso
- [x] **API Docs** generation from code
- [x] **Component catalog** (Storybook? SAPUI5 visual regression?)
- [x] **Runbooks** / operational docs

--- RESPUESTA ---

**ADR** (Architecture Decision Records) template y proceso: Adoptar un proceso formal de ADR para documentar todas las decisiones arquitectónicas relevantes. Cada ADR deberá incluir como mínimo el contexto, la decisión tomada, las alternativas evaluadas, las consecuencias, el estado y las referencias relacionadas. Los ADR se almacenarán junto al código fuente, con numeración secuencial (ADR-001, ADR-002, etc.), y nunca se modificarán para cambiar el historial: las decisiones sustituidas deberán referenciarse mediante nuevos ADR que indiquen explícitamente qué decisión reemplazan.

**API Docs** generation from code: Generar automáticamente la documentación de la API a partir del código utilizando el estándar OpenAPI 3.1. La especificación deberá mantenerse sincronizada con la implementación y exponerse mediante Swagger UI para facilitar la exploración, pruebas e integración. El proceso de integración continua deberá validar que la documentación se genere correctamente y permanezca alineada con la implementación de la API.

**Component catalog** (Storybook? SAPUI5 visual regression?): Implementar un catálogo de componentes integrado en la propia aplicación mediante un UI Component Playground, donde cada componente reutilizable pueda visualizarse y probarse de forma aislada junto con sus distintos estados. Complementar este catálogo con pruebas de regresión visual utilizando Playwright para detectar cambios no deseados en la interfaz durante el proceso de integración continua. Para un proyecto basado en SAPUI5, esta estrategia ofrece una mejor integración y menor complejidad que adoptar Storybook.

**Runbooks** / operational docs: Mantener un conjunto de Runbooks para documentar los procedimientos operativos del proyecto. Cada Runbook deberá describir una operación específica (instalación, actualizaciones, migraciones, copias de seguridad, recuperación ante fallos, sincronización, gestión de modelos de IA, resolución de incidencias, etc.), incluyendo su objetivo, requisitos previos, procedimiento paso a paso, validaciones y acciones de recuperación. Los Runbooks deberán almacenarse junto al código fuente en formato Markdown y mantenerse actualizados como parte del proceso de desarrollo.

### 3.8 Documentación Viva


--- NOTA ---


---

## 4. RIESGOS IDENTIFICADOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Plantillas "oficiales" inexistentes bloquean inicio | **Crítica** | **Bloqueador total** | Crear plantillas base en Fase 2 |
| Versiones de dependencias sin lock | Alta | Medio | Definir en package.json + Renovate |
| AI Provider interface no definido | Alta | Alto | Definir puerto en Fase 2 |
| Electron ↔ Web reutilización no validada | Media | Alto | Spike técnico temprano |
| SQLite migraciones sin herramienta | Media | Medio | Seleccionar migración tool |
| Testing IA no determinístico | Alta | Alto | Definir evals + golden masters |
| Secrets en repo (credenciales email) | Media | Crítico | Secret scanning + .gitignore estricto |

--- RESPUESTA ---

Plantillas "oficiales" inexistentes bloquean inicio: 

Este riesgo no aplica. El proyecto cuenta con repositorios de referencia que servirán como base para extraer patrones arquitectónicos y reutilizar implementaciones cuando resulte conveniente:

Backend modelo: https://github.com/horangelmillan/odata-server
Skill de arquitectura Backend: https://github.com/horangelmillan/node-modular-monolith-skill
Frontend modelo: https://github.com/MundoCloud-Devs/SmartInventory-frontend

Si el repositorio del frontend no está accesible, existe una copia local en:

C:\Users\Horan\Desktop\SmartInventory-frontend-main

Estos proyectos no deben considerarse plantillas rígidas. Su propósito es servir como referencia para reutilizar la filosofía arquitectónica, patrones de diseño, estructura de carpetas y funcionalidades cuando aporten valor al nuevo proyecto.

Se permite reutilizar código mediante copia, adaptación o extracción de módulos, e incluso crear forks temporales durante el proceso de análisis. Sin embargo, dichos repositorios no deberán mantenerse como dependencias ni como submódulos Git del nuevo proyecto, evitando así conflictos de historial y acoplamiento innecesario.

### 4. Riesgos - Comentarios / Mitigaciones adicionales



--- NOTA ---


---

## 5. DEPENDENCIAS TÉCNICAS (Orden de ejecución)

```
FUNDACIÓN (Fase 0) → CALIDAD (Fase 1) → ARQUITECTURA BASE (Fase 2) → CI/CD (Fase 3) → OBSERVABILIDAD (Fase 4)
```

--- RESPUESTA ---
### 5. Dependencias - Ajustes al orden propuesto



--- NOTA ---


---

## 6. DECISIONES ARQUITECTÓNICAS PENDIENTES (Priorizadas)

| # | Decisión | Categoría | Urgencia | Estado |
|---|----------|-----------|----------|--------|
| 1 | **Package Manager** (pnpm recomendado) | Fundación | **Crítica** | ✅ **APROBADO** (pnpm, §7) |
| 2 | **Monorepo Structure** (Nx vs Turborepo vs custom) | Fundación | **Crítica** | ✅ **APROBADO** (custom, §7) |
| 3 | **Node.js Version** (20 LTS vs 22) | Fundación | **Crítica** | ✅ **APROBADO** (última LTS estable, §8 D3) |
| 4 | **AI Provider Interface** (Puerto para LLM local) | Arquitectura | **Crítica** | ✅ **DEFINIDO** (§3.7, ADR-002) |
| 5 | **LLM Runtime** (Ollama vs llama.cpp vs Transformers.js) | IA | **Crítica** | ✅ **APROBADO** (desacoplado multi-adapter, §3.7) |
| 6 | **Database Migration Tool** (Kysely vs Drizzle vs Prisma) | Persistencia | **Alta** | ✅ **APROBADO** (Drizzle + Drizzle Kit, §3.6) |
| 7 | **Electron Build System** (electron-forge vs vite-plugin-electron) | Desktop | **Alta** | ✅ **APROBADO** (vite-plugin-electron + electron-builder, §3.6) |
| 8 | **SAPUI5 Build** (UI5 Tooling Vite vs Custom) | Frontend | **Alta** | ✅ **APROBADO** (UI5 CLI v4, §8 D8) |
| 9 | **Release Versioning** (SemVer vs Calendar vs Custom) | Proceso | **Media** | ✅ **APROBADO** (SemVer 2.0, §8 D9) |
| 10 | **Observability Stack** (OpenTelemetry + Loki + Tempo vs Custom) | Operación | **Media** | ✅ **APROBADO** (OTel SDK + Pino, export opcional, §8 D10) |

---

## 7. DECISIÓN 1: Package Manager & Monorepo Structure (EN CURSO)

### Recomendación Técnica
**pnpm + Monorepo con estructura custom (sin Nx/Turborepo inicialmente)**

### Justificación
| Factor | pnpm | npm | yarn |
|--------|------|-----|------|
| Disk efficiency | ✅ Hard links | ❌ | ⚠️ |
| Speed | ✅ | ❌ | ⚠️ |
| Monorepo support | ✅ workspace:* | ⚠️ workspaces | ✅ workspaces |
| Strict peer deps | ✅ | ❌ | ⚠️ |
| Electron compatibility | ✅ | ✅ | ✅ |
| SAPUI5 tooling compatibility | ✅ | ✅ | ✅ |

### Estructura Monorepo Propuesta
```
email-ia/
├── packages/
│   ├── core/           # Shared Kernel + Domain (hexagonal core)
│   ├── backend/        # Express + Adapters (HTTP, DB, Email, AI)
│   ├── frontend/       # SAPUI5 App (UI5 Tooling Vite)
│   ├── electron/       # Electron Main + Preload (vite-plugin-electron)
│   ├── ai-provider/    # AI Provider Port + Adapters (Ollama, llama.cpp)
│   ├── db/             # Database layer (Kysely + SQLite + Migrations)
│   └── shared/         # Types, utils, constants, config schemas
├── tools/
│   ├── eslint-config/  # Shared ESLint config
│   ├── tsconfig/       # Shared TypeScript configs
│   └── prettier-config/
├── .github/
│   ├── workflows/      # CI/CD
│   └── dependabot.yml
├── package.json        # Root workspace config
├── pnpm-workspace.yaml
├── turbo.json          # (opcional, para cache remoto futuro)
└── README.md
```

### Alternativas Evaluadas
| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **pnpm + Custom Monorepo** (recomendada) | Control total, zero config overhead, disk efficient, fast | Requiere configurar tooling propio |
| **Nx** | Generators, affected graph, caching, plugins | Overhead, learning curve, opinionated |
| **Turborepo** | Remote caching, simple config | Less flexible, Vercel dependency |
| **npm workspaces** | Zero config, native | Slower, no hoisting control, peer deps issues |
| **Polyrepo** | Isolation, independent deploys | Code sharing complexity, version sync overhead |

---

### 🎯 DECISIÓN 1 - TU RESPUESTA REQUERIDA

**¿Apruebas usar pnpm con monorepo custom (estructura propuesta arriba) como fundación del proyecto, o prefieres evaluar Nx/Turborepo primero?**

--- RESPUESTA ---

Aprobado: utilizar pnpm Workspace con una estructura de monorepo personalizada como base del proyecto.

Justificación:

La arquitectura del proyecto ya está claramente definida (Hexagonal, modular y orientada a dominios), por lo que no necesitamos que una herramienta externa imponga una estructura.
pnpm proporciona workspaces, gestión eficiente de dependencias y enlaces entre paquetes, cubriendo las necesidades actuales del proyecto con menor complejidad.
Evitar dependencias innecesarias desde el inicio reduce la curva de aprendizaje, el mantenimiento y el acoplamiento a herramientas específicas.
La estructura del monorepo será diseñada específicamente para este proyecto, priorizando claridad, modularidad y reutilización entre frontend, backend y paquetes compartidos.

Nx y Turborepo no se adoptarán inicialmente. Podrán reevaluarse en el futuro si el crecimiento del proyecto (más aplicaciones, más equipos o tiempos de build elevados) justifica incorporar capacidades adicionales como caché distribuida, generación de código o pipelines avanzados.

### DECISIÓN 1: Package Manager & Monorepo



--- NOTA ---


---

## 8. PRÓXIMAS DECISIONES (Se desbloquean tras Decisión 1)

> **Estado 2026-08-19**: Todas las decisiones de esta sección han sido resueltas. Se conservan las alternativas evaluadas como registro histórico.

### DECISIÓN 2: Monorepo Tooling (si no custom)
- [x] Nx
- [x] Turborepo
- [x] Solo pnpm workspaces + scripts custom

--- RESPUESTA ---

Resuelta con la Decisión 1: monorepo custom con pnpm workspaces. Nx/Turborepo quedan descartados inicialmente y se reevaluarán solo si el crecimiento lo justifica.

### DECISIÓN 3: Node.js Version
- [x] Node 20 LTS (Iron) - Soporte hasta Abr 2026
- [x] Node 22 LTS (Jod) - Soporte hasta Abr 2027
- [x] Node 23 (Current) - Solo si se requieren features específicas

--- RESPUESTA ---

Usar la última versión LTS estable disponible al momento del scaffolding (Fase 1). La versión exacta se fijará en el `.nvmrc`/`engines` del monorepo al inicializarlo, garantizando soporte ESM completo y compatibilidad con pnpm y UI5 CLI v4 (requiere Node ≥ 20.11).

### DECISIÓN 4: AI Provider Interface (Puerto Hexagonal)
```typescript
// Ejemplo de contrato a definir
interface AIProviderPort {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(texts: string[]): Promise<number[][]>;
  listModels(): Promise<ModelInfo[]>;
  pullModel(name: string): Promise<void>;
}
```
- [x] Definir puerto completo
- [x] Definir adapters: Ollama, llama.cpp (node-llama-cpp), Transformers.js
- [x] Estrategia de fallback / multi-provider

--- RESPUESTA ---

Definida en §3.7: AI Provider desacoplado, versátil, configurable para cualquier proveedor local o remoto. El puerto definitivo se materializará en `packages/ai-provider` durante Fase 2 (ver ADR-002).

### DECISIÓN 5: LLM Runtime
| Opción | Pros | Contras |
|--------|------|---------|
| **Ollama** | Simple, model management built-in, API compatible | Proceso externo, memory overhead |
| **llama.cpp (node-llama-cpp)** | Embedded, fast, no external process | Native bindings, compilation complexity |
| **Transformers.js** | Pure WASM, runs in browser/Electron renderer | Slower, limited model support, memory heavy |
| **llamafile** | Single file, portable, embedded | Less flexible, larger binary |

--- RESPUESTA ---

Resuelta en §3.7: la app no depende de un runtime específico. Runtime por defecto embebido (llama.cpp/llamafile) para minimizar instalaciones del usuario, con adaptadores para Ollama, LM Studio, OpenAI y otros. Para pruebas iniciales se usará LM Studio.

### DECISIÓN 6: Database Migration Tool
| Herramienta | Tipo | Pros | Contras |
|-------------|------|------|---------|
| **Kysely** | Query builder + migrations | Type-safe, lightweight, SQLite native | Manual migrations |
| **Drizzle ORM** | ORM + migrations | Type-safe, fast, SQLite support | Relativamente nuevo |
| **Prisma** | ORM + migrations | Mature, great DX, migration engine | Heavy, engine binary, SQLite limitations |
| **Raw SQL + custom** | SQL puro | Full control, zero deps | Manual, error-prone |

--- RESPUESTA ---

Resuelta en §3.6: Drizzle + Drizzle Kit.

### DECISIÓN 7: Electron Build System
| Opción | Pros | Contras |
|--------|------|---------|
| **vite-plugin-electron** | Vite-native, HMR, simple config | Menos maduro que forge |
| **electron-forge** | Mature, plugins, auto-updates | Config compleja, webpack-based (legacy) |
| **electron-builder (directo)** | Control total, mature | Manual setup, no HMR built-in |

--- RESPUESTA ---

Resuelta en §3.6: vite-plugin-electron para desarrollo (HMR) + electron-builder para distribución.

### DECISIÓN 8: SAPUI5 Build
| Opción | Pros | Contras |
|--------|------|---------|
| **UI5 Tooling Vite** | Modern, Vite integration, fast HMR | Beta, menos documentado |
| **UI5 Tooling (webpack)** | Maduro, estándar SAP | Webpack, slower, config compleja |
| **Custom Vite + @ui5/builder** | Control total | Maintenance burden |

--- RESPUESTA ---

Aprobado: **UI5 CLI v4** (sucesor oficial de UI5 Tooling, renombrado en 2025; estable, ESM, builder propio sin webpack). Las opciones Vite siguen siendo middlewares comunitarios no oficiales y el build custom añade mantenimiento innecesario. Se reevaluará el middleware Vite comunitario si UI5 CLI v5 lo integra de forma oficial.

### DECISIÓN 9: Release Versioning
| Opción | Pros | Contras |
|--------|------|---------|
| **SemVer 2.0** | Estándar, compatible con Conventional Commits, dependabot y auto-update de electron-builder | Requiere disciplina en el análisis de breaking changes |
| **Calendar** (ej. 2026.08) | Simple, legible | No comunica compatibilidad ni breaking changes |
| **Custom** | Adaptado al proyecto | Coste de definición y tooling propio |

--- RESPUESTA ---

Aprobado: **SemVer 2.0** combinado con Conventional Commits (ya adoptado). La generación de versiones/tags se automatizará en la fase de CI/CD (Fase 3), manteniendo por ahora versiones definidas manualmente durante el desarrollo local.

### DECISIÓN 10: Observability Stack
| Opción | Pros | Contras |
|--------|------|---------|
| **OTel SDK + Pino (export opcional)** | Ligero, vendor-neutral, privacy-first, sin infra adicional | Análisis manual local sin dashboards |
| **Stack completo (OTel + Loki + Tempo)** | Trazas/logs centralizados con dashboards | Infra pesada local, sin destino de despliegue actual |
| **SaaS (Sentry/Datadog/New Relic)** | Crash reporting maduro, bajo esfuerzo | Envía datos a terceros, contradice privacy-first sin opt-in |

--- RESPUESTA ---

Aprobado: **OTel SDK + Pino con export OTLP opcional, deshabilitado por defecto** (privacidad-first, consistente con SQLCipher y sin infra de despliegue por ahora). Incluye: logs estructurados con Pino (ya decidido), instrumentación OTel (trazas) activable por configuración, health checks/readiness en el Express local y error handling unificado. Loki/Tempo y SaaS se reevalúan cuando exista un destino de despliegue.

---

## 9. BITÁCORA DE CAMBIOS

| Fecha | Decisión | Autor | Notas |
|-------|----------|-------|-------|
| 2026-07-25 | Documento creado | AI Architect | Análisis inicial completo |
| 2026-08-19 | Cierre de definición | AI Architect + Usuario | D1-D10 resueltas; checklists §3 sincronizados; se crean ADR-001 (fundación) y ADR-002 (stack técnico) |

---

> **Fin del documento**. Completa las secciones `--- RESPUESTA ---` y yo continuaré con el plan de ejecución basado en tus decisiones.