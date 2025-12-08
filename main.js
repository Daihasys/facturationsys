const { app, BrowserWindow, ipcMain, session } = require("electron/main");
const path = require("node:path");
const { fork } = require("child_process");

let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();
}

app.whenReady().then(async () => { // Made async to await clearStorageData
  // Limpiar localStorage al iniciar la aplicación
  console.log("Limpiando localStorage al iniciar...");
  try {
    await session.defaultSession.clearStorageData();
    console.log('localStorage limpiado al iniciar.');
  } catch (error) {
    console.error('Error al limpiar localStorage al iniciar:', error);
  }

  // Iniciar el servidor backend
  console.log("Iniciando servidor backend...");
  serverProcess = fork(path.join(__dirname, "server.js"));

  serverProcess.on("exit", (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("will-quit", () => {
  // Terminar el proceso del servidor antes de salir
  console.log("Terminando servidor backend...");
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
