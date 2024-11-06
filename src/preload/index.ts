import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api: any = {
  openDirectory: () => ipcRenderer.invoke('open-directory'),
  loadImages: (directoryPath) => ipcRenderer.invoke('load-images', directoryPath),
  onInitImages: (callback) => ipcRenderer.on('init-path', callback),
  captureScreen: () => ipcRenderer.invoke('capture-screen'), // Invoke the capture-screen handler in main process
  onEnterFullScreen: (callback) => ipcRenderer.on('enter-full-screen', callback),
  onLeaveFullScreen: (callback) => ipcRenderer.on('leave-full-screen', callback)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api as any
}
