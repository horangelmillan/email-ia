# ENGINEERING

## Backend

La implementación utilizará la plantilla oficial de Arquitectura Hexagonal + Shared Kernel del proyecto.

La IA nunca deberá modificar dicha arquitectura sin autorización.

Toda nueva funcionalidad deberá respetar completamente dicha plantilla.

---

## Frontend

La implementación utilizará la plantilla oficial SAPUI5.

Arquitectura MVC.

La navegación, modelos, servicios y configuración deberán respetar completamente dicha plantilla.

---

## Estándares

Lenguaje

- TypeScript

Calidad

- ESLint
- Prettier

Git Hooks

- Husky
- lint-staged

Testing

Backend

- Vitest
- Supertest

Frontend

- Vitest
- Playwright

Cobertura mínima

80%

---

## Seguridad

Siempre utilizar

- Helmet
- CORS
- Compression

Nunca exponer secretos.

Nunca almacenar credenciales en el repositorio.

Variables únicamente mediante archivos de entorno.

---

## Git

Modelo

main

develop

feature/*

hotfix/*

release/*

Cada feature deberá desarrollarse en una rama independiente.

Nunca trabajar directamente sobre main.

Todo cambio deberá pasar:

- lint
- tests
- revisión

antes de integrarse.

---

## Convenciones

Siempre:

- SOLID
- Clean Code
- DRY
- KISS
- YAGNI

Nunca duplicar lógica.

Siempre reutilizar servicios existentes antes de crear nuevos.

Toda excepción deberá seguir una estrategia unificada.

Toda nueva dependencia deberá justificarse.
