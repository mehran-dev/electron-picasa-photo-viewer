import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.webContents.openDevTools()
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  console.log('process.argv[1]', process.argv[1])
  console.log('process.argv', process.argv)

  // Handle opening a file
  if (process.argv.length > 1) {
    // const filePath = process.argv[1] // Get the file path passed from the OS
    const filePath = process.env.NODE_ENV === 'development' ? process.argv[2] : process.argv[1]

    // Extract the directory path
    const directoryPath = path.dirname(filePath)
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('before send')

      mainWindow.webContents.send('init-path', directoryPath) // Send file path to renderer
    })
  }
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('open-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0] || ''
})

// Handle loading images from a directory

ipcMain.handle('load-images', async (_event, directoryPath) => {
  try {
    console.log('directoryPath', directoryPath)

    const files = fs.readdirSync(directoryPath)

    const imageFiles = files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map((file) => {
        const filePath = path.join(directoryPath, file)
        const imageData = fs.readFileSync(filePath) // Read the image as a binary buffer
        const base64Image = imageData.toString('base64') // Convert to base64
        return { name: file, data: base64Image } // Return base64 data
      })

    return imageFiles
  } catch (error) {
    console.error('Error loading images:', error)
    return []
  }
})
