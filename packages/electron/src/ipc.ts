import { ipcMain } from 'electron';
import { coreName } from '@email-ia/core';
import type { RagPort, PromptPort } from '@email-ia/core';

export interface IpcDeps {
  rag?: RagPort | undefined;
  prompts?: PromptPort | undefined;
}

export function registerIpcHandlers(deps?: IpcDeps): void {
  ipcMain.handle('ping', () => 'pong');

  ipcMain.handle('get-versions', () => ({
    electron: process.versions.electron ?? 'unknown',
    node: process.versions.node ?? 'unknown',
    core: coreName(),
  }));

  if (deps?.rag) {
    const rag = deps.rag;
    ipcMain.handle(
      'rag:search',
      async (_e, query: string, opts?: { limit?: number; accountId?: string }) => {
        return rag.search(query, opts);
      },
    );
  }

  if (deps?.prompts) {
    const prompts = deps.prompts;
    ipcMain.handle('prompts:list', async () => prompts.list());
    ipcMain.handle('prompts:get', async (_e, name: string, version?: string) =>
      prompts.get(name, version),
    );
    ipcMain.handle(
      'prompts:render',
      async (_e, name: string, variables: Record<string, unknown>, version?: string) =>
        prompts.render(name, variables, version),
    );
    ipcMain.handle('prompts:evaluate', async (_e, cases: unknown) =>
      prompts.evaluate(cases as never),
    );
  }
}
