import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { backendName } from '@email-ia/backend';
import { coreName } from '@email-ia/core';
import { SHARED_PACKAGE } from '@email-ia/shared';

const isSmoke = process.argv.includes('--smoke');

function coreProbe(): string {
  return `${coreName()} + ${SHARED_PACKAGE} + ${backendName()}`;
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    show: !isSmoke,
    webPreferences: {
      preload: join(import.meta.dirname, '..', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void window.loadFile(join(import.meta.dirname, 'index.html'));
}

void app.whenReady().then(() => {
  console.log(`[probe] Core cargado dentro del proceso main de Electron: ${coreProbe()}`);
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
