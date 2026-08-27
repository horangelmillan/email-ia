---
name: sapui5-email-ia
description: Skill custom SAPUI5 para Email IA — UI5 CLI v4 + OpenUI5 1.133.0 + MVC + routing home/inbox. Usar SIEMPRE al tocar packages/frontend (Component.js, manifest.json, vistas XML, controladores, modelos, servicios). Complementa la skill global sapui5 (genérica 1.148) con la receta exacta de este monorepo.
---

# SAPUI5 — Email IA (UI5 CLI v4, OpenUI5 1.133.0)

> Proyecto: `packages/frontend` — Desktop First, Electron contenedor, Core hexagonal reutilizable web. SAPUI5 MVC + UI5 CLI v4 (no webpack, no Vite custom).

## 1. Stack y rutas canónicas

| Artefacto        | Ruta absoluta                                                              | Notas                                                                                  |
| ---------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| UI5 config       | `C:\Users\Horan\Desktop\Email IA\packages\frontend\ui5.yaml`               | `specVersion: 4.0`, framework `OpenUI5 1.133.0`                                        |
| Index            | `packages/frontend/webapp/index.html`                                      | bootstrap `sap-ui-core`, `data-sap-ui-resourceroots`                                   |
| Component        | `packages/frontend/webapp/Component.js`                                    | `sap/ui/core/UIComponent` extend, `metadata.manifest: json`                            |
| Manifest         | `packages/frontend/webapp/manifest.json`                                   | `sap.app` + `sap.ui5` routing `home`/`inbox`, models `i18n`/`app`, `sap_horizon` theme |
| App view         | `packages/frontend/webapp/view/App.view.xml`                               | Shell + `App` control, `nav` container                                                 |
| Home/Inbox views | `packages/frontend/webapp/view/Home.view.xml` + `Inbox.view.xml`           | `sap.m` controls                                                                       |
| Controllers      | `packages/frontend/webapp/controller/App.controller.js` + `Home` + `Inbox` | `sap/ui/core/mvc/Controller`                                                           |
| Models           | `packages/frontend/webapp/model/models.js`                                 | `app`/`device` JSONModel                                                               |
| Services         | `packages/frontend/webapp/service/EmailService.js`                         | `healthCheck` placeholder, futuro `fetch` backend                                      |
| i18n             | `packages/frontend/webapp/i18n/i18n.properties` + `i18n_en` + `i18n_es`    | `fallbackLocale en` requiere `i18n_en.properties` existente                            |
| CSS              | `packages/frontend/webapp/css/style.css`                                   |                                                                                        |
| Package          | `packages/frontend/package.json`                                           | `ui5 build --all --clean-dest --dest dist`, `ui5 serve --port 8080 --open index.html`  |

Referencias: `PROJECT_STATE.md:35`, `ADR-006`, `ENGINEERING.md:15`.

## 2. Comandos (desde raíz o `packages/frontend`)

```bash
pnpm --filter @email-ia/frontend build        # ui5 build --all (7 proyectos, 30-38s)
pnpm --filter @email-ia/frontend start        # ui5 serve :8080
npx ui5 build --all --clean-dest --dest dist  # directo
npx ui5 serve --port 8080 --open index.html
```

CI no compila UI5 con `tsc` (`typecheck` echo, `packages/frontend/package.json:9`). Validar con `ui5 build`.

## 3. Patrones obligatorios (no inventar)

1. **Component + Manifest first:** todo routing/model se declara en `manifest.json` (`sap.ui5/routing/routes` + `targets`), no en `Component.js` hardcode.
2. **MVC estricto:** XML view = layout, controller = eventos/binding, model = estado (`model/models.js` factory `createDeviceModel`/`createAppModel`). No lógica de negocio en controller.
3. **i18n:** claves en `i18n.properties`, `i18n_en/es` espejo; `manifest.json` warning si falta `fallbackLocale`.
4. **Servicios:** `service/EmailService.js` usa `fetch` DI (testeable), no `jQuery.ajax` legacy.
5. **Estilo:** `sap_horizon` theme, `css/style.css` solo overrides, no inline styles en XML.
6. **Build:** `ui5.yaml` specVersion 4.0 obligatorio; no añadir webpack/Vite al frontend.

## 4. Validación con Playwright (sinérgica con playwright-testing)

Antes de declarar done una feature UI:

1. `ui5 serve` OK (200 en `http://localhost:8080/index.html`).
2. `browser_navigate` → verificar routing `#/home` ↔ `#/inbox`, títulos visibles `browser_snapshot`, sin errores `browser_console_messages`, sin 404 `browser_network_requests`.
3. No declarar done solo porque `ui5 build` compila — validación visual obligatoria (regla proyecto `playwright-testing` adaptada a Email IA).

## 5. Quirks Email IA

- `core.autocrlf` debe ser `false` + `.gitattributes eol=lf` (`PROJECT_STATE.md:115`, `ADR-006:42`) — si `format:check` falla por CRLF, hacer `git config core.autocrlf false && git add --renormalize . && pnpm format`.
- `vite-plugin-electron` es solo para `packages/electron` (`vite@6.3.5` requerido `pnpm-workspace.yaml:5`), no tocar `packages/frontend`.
- No crear `Component-preload.js` manual — lo genera `ui5 build`.
