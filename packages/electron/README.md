# @email-ia/electron

Contenedor Electron (Main + Preload + IPC) — ADR-006.

- Electron únicamente como contenedor: el Core no depende de Electron (spike --smoke OK).
- `vite@6.3.5` + `vite-plugin-electron@0.28.8` (HMR): `vite.config.ts` (main `src/main.ts` → `dist/main.js`, preload `src/preload.ts` → `dist/preload.mjs`, renderer `dist/index.html`).
- `src/main.ts` (BrowserWindow, `sandbox:true`/`contextIsolation:true`, `resolvePreloadPath`/`resolveIndexHtml` con `existsSync` fallback), `src/ipc.ts` (`ipcMain.handle ping/get-versions`), `src/preload.ts` + `preload.cjs` (expone `window.emailIa` con `probe/ping/getVersions`).
- `electron-builder.yml` (appId `com.emailia.app`, files `dist/**/*` + `preload.cjs`/`index.html`); empaquetado vía `npx --yes electron-builder` (fuera de workspace por hang pnpm en Windows).
- Scripts: `build` (tsc), `dev` (vite), `build:vite` (vite build), `start` (electron .), `smoke` (electron . --smoke), `package` (npx electron-builder).
- `pnpm --filter @email-ia/electron build` + `typecheck` verdes; `pnpm build` raíz incluye `tsc` + `ui5 build` (38 s).
