const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
        on: (channel, listener) => ipcRenderer.on(channel, listener)
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    runBinary: (model1Init, model1Trans) => ipcRenderer.invoke('run-binary', model1Init, model1Trans)
});