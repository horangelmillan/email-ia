import { contextBridge, ipcRenderer } from 'electron';

export type EmailIaApi = {
  probe: string;
  ping: () => Promise<string>;
  getVersions: () => Promise<{ electron: string; node: string; core: string }>;
  searchRag: (query: string, opts?: { limit?: number; accountId?: string }) => Promise<unknown>;
  listPrompts: () => Promise<unknown>;
  getPrompt: (name: string, version?: string) => Promise<unknown>;
  renderPrompt: (
    name: string,
    variables: Record<string, unknown>,
    version?: string,
  ) => Promise<unknown>;
  evaluatePrompts: (cases: unknown) => Promise<unknown>;
};

const api: EmailIaApi = {
  probe: 'preload ok',
  ping: () => ipcRenderer.invoke('ping') as Promise<string>,
  getVersions: () =>
    ipcRenderer.invoke('get-versions') as Promise<{ electron: string; node: string; core: string }>,
  searchRag: (query, opts) => ipcRenderer.invoke('rag:search', query, opts) as Promise<unknown>,
  listPrompts: () => ipcRenderer.invoke('prompts:list') as Promise<unknown>,
  getPrompt: (name, version) =>
    ipcRenderer.invoke('prompts:get', name, version) as Promise<unknown>,
  renderPrompt: (name, variables, version) =>
    ipcRenderer.invoke('prompts:render', name, variables, version) as Promise<unknown>,
  evaluatePrompts: (cases) => ipcRenderer.invoke('prompts:evaluate', cases) as Promise<unknown>,
};

contextBridge.exposeInMainWorld('emailIa', api);

declare global {
  interface Window {
    emailIa: EmailIaApi;
  }
}
