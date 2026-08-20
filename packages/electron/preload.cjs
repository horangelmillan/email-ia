const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('emailIa', {
  probe: 'preload ok',
});
