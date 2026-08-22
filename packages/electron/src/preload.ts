import { contextBridge, ipcRenderer } from 'electron';

export type EmailIaApi = {
  probe: string;
  ping: () => Promise<string>;
  getVersions: () => Promise<{ electron: string; node: string; core: string }>;
};

const api: EmailIaApi = {
  probe: 'preload ok',
  ping: () => ipcRenderer.invoke('ping') as Promise<string>,
  getVersions: () =>
    ipcRenderer.invoke('get-versions') as Promise<{ electron: string; node: string; core: string }>,
};

contextBridge.exposeInMainWorld('emailIa', api);

declare global {
  interface Window {
    emailIa: EmailIaApi;
  }
}
