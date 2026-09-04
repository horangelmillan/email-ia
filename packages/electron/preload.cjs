const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emailIa', {
  probe: 'preload ok',
  ping: () => ipcRenderer.invoke('ping'),
  getVersions: () => ipcRenderer.invoke('get-versions'),
  searchRag: (query, opts) => ipcRenderer.invoke('rag:search', query, opts),
  listPrompts: () => ipcRenderer.invoke('prompts:list'),
  getPrompt: (name, version) => ipcRenderer.invoke('prompts:get', name, version),
  renderPrompt: (name, variables, version) =>
    ipcRenderer.invoke('prompts:render', name, variables, version),
  evaluatePrompts: (cases) => ipcRenderer.invoke('prompts:evaluate', cases),
});
