const { contextBridge } = require('electron')
const remote = require('@electron/remote')

process.once('loaded', () => {
  global.REMOTE = remote
})

contextBridge.exposeInMainWorld('electronAPI', {
  getRemote: () => remote
})
