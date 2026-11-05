const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getData: () => ipcRenderer.invoke('data:get'),
  saveUser: (u) => ipcRenderer.invoke('user:save', u),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),
  sync: (what) => ipcRenderer.invoke('sync:run', what),
  addWish: (url) => ipcRenderer.invoke('wish:add', url),
  open: (url) => ipcRenderer.invoke('open:external', url),
  copy: (t) => ipcRenderer.invoke('clipboard:copy', t),
  logout: () => ipcRenderer.invoke('profile:logout'),
  openFolder: () => ipcRenderer.invoke('profile:folder'),
  exportCsv: (csv) => ipcRenderer.invoke('export:csv', csv),
  onProgress: (cb) => ipcRenderer.on('sync:progress', (e, d) => cb(d)),
  saveCustom: (c) => ipcRenderer.invoke('custom:save', c),
  onChanged: (cb) => ipcRenderer.on('data:changed', (e, d) => cb(d)),
  setLang: (l) => ipcRenderer.invoke('lang:set', l),
  onProfile: (cb) => ipcRenderer.on('profile', (e, d) => cb(d)),
});
