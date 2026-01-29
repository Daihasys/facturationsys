// Preload script for Electron
// This script runs in a sandboxed environment before the web page is loaded

const { contextBridge } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Add any IPC methods here if needed in the future
});
