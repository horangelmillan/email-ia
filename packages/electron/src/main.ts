import { app, BrowserWindow } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { backendName } from '@email-ia/backend';
import { coreName } from '@email-ia/core';
import { SHARED_PACKAGE } from '@email-ia/shared';
import { registerIpcHandlers } from './ipc.js';

const isSmoke = process.argv.includes('--smoke');

function coreProbe(): string {
  return `${coreName()} + ${SHARED_PACKAGE} + ${backendName()}`;
}

function resolvePreloadPath(): string {
  const base = import.meta.dirname;
  const vitePreload = join(base, 'preload.mjs');
  if (existsSync(vitePreload)) {
    return vitePreload;
  }
  const vitePreloadJs = join(base, 'preload.js');
  if (existsSync(vitePreloadJs)) {
    return vitePreloadJs;
  }
  // Fallback legacy (tsc build) — preload.cjs en raíz del paquete
  return join(base, '..', 'preload.cjs');
}

function resolveIndexHtml(): string {
  const base = import.meta.dirname;
  const viteHtml = join(base, 'index.html');
  if (existsSync(viteHtml)) {
    return viteHtml;
  }
  return join(base, '..', 'index.html');
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    show: !isSmoke,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void window.loadFile(resolveIndexHtml());
}

void app.whenReady().then(() => {
  console.log(`[probe] Core cargado dentro del proceso main de Electron: ${coreProbe()}`);
  registerIpcHandlers();
  if (isSmoke) {
    app.quit();
    return;
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
