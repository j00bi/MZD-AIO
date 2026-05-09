const remote = require('@electron/remote')

process.once('loaded', () => {
  global.REMOTE = remote
})
