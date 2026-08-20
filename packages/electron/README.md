# @email-ia/electron

Contenedor Electron (Main + Preload).

- Electron únicamente como contenedor: el Core no depende de Electron (verificado en el spike).
- `pnpm --filter @email-ia/electron build` compila `dist/main.js` (ESM).
- `pnpm --filter @email-ia/electron smoke` arranca Electron en modo smoke: carga los paquetes del Core en el proceso main, loguea la sonda y cierra.
- `pnpm --filter @email-ia/electron start` abre la ventana de la app.

Notas del spike:

- El preload es CommonJS (`preload.cjs`): los preloads con `sandbox: true` no soportan ESM. Se referencia desde `dist/../preload.cjs` en desarrollo; al empaquetar (electron-builder, Fase 2) se copiará al directorio de salida.
- Los paquetes del Core se resuelven vía workspaces pnpm (dist previo con `pnpm build`).
- Pendiente Fase 2: vite-plugin-electron (HMR) + electron-builder (distribución) + IPC real renderer ↔ main.
