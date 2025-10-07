const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const { fork } = require('child_process')

let serverProcess

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  // Iniciar el servidor backend
  console.log('Iniciando servidor backend...')
  serverProcess = fork(path.join(__dirname, 'server.js'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  // Terminar el proceso del servidor antes de salir
  console.log('Terminando servidor backend...')
  serverProcess.kill()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})