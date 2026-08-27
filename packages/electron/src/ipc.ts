import { ipcMain } from 'electron';
import { coreName } from '@email-ia/core';

export function registerIpcHandlers(): void {
  ipcMain.handle('ping', () => 'pong');

  ipcMain.handle('get-versions', () => ({
    electron: process.versions.electron ?? 'unknown',
    node: process.versions.node ?? 'unknown',
    core: coreName(),
  }));
}
