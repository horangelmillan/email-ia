# @email-ia/frontend

Aplicación SAPUI5 (MVC) — UI5 CLI v4 (ADR-006).

- `ui5.yaml` specVersion 4.0, OpenUI5 1.133.0
- `webapp/Component.js`, `manifest.json` (routing home/inbox, modelos i18n/app)
- `view/App|Home|Inbox`, `controller/App|Home|Inbox`, `model/models.js`, `service/EmailService.js`, `i18n/*`, `css/style.css`
- `pnpm --filter @email-ia/frontend build` → `ui5 build --all` (dist), `pnpm --filter @email-ia/frontend start` → `ui5 serve --port 8080`
- Referencia: SmartInventory-frontend (C:\Users\Horan\Desktop\SmartInventory-frontend-main)
- Pendiente Fase 3: UI Component Playground + Playwright visual regression
