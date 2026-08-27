const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emailIa', {
  probe: 'preload ok',
  ping: () => ipcRenderer.invoke('ping'),
  getVersions: () => ipcRenderer.invoke('get-versions'),
});
