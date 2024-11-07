import { app, shell, BrowserWindow, ipcMain, dialog, desktopCapturer, screen } from 'electron'
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
    // frame: false, // This will remove the default OS frame, which can sometimes create unexpected padding

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
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('enter-full-screen') // Send a signal to renderer
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('leave-full-screen') // Send a signal to renderer
  })
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('enter-maximized')
    mainWindow.webContents.send('enter-full-screen') // Send a signal to renderer
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('leave-maximized')
    mainWindow.webContents.send('leave-full-screen') // Send a signal to renderer
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  // captureScreen()
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

// function captureScreen() {
//   desktopCapturer
//     .getSources({ types: ['screen'] })
//     .then((sources) => {
//       for (const source of sources) {
//         if (source.name === 'Screen 1') {
//           // or choose your screen
//           const image = source.thumbnail.toDataURL()
//           // Send this image to renderer process
//           mainWindow.webContents.send('screen-captured', image)
//         }
//       }
//     })
//     .catch((err) => console.error('Failed to capture screen:', err))
// }

// Capture the screen when requested
/* ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] })
  for (const source of sources) {
    if (source.name === 'Screen 1') {
      // You can choose the screen you need
      const image = source.thumbnail.toDataURL() // Capture the image as Data URL
      return image
    }
  }
  return null
}) */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// @ts-ignore
function getActiveScreen() {
  // Get the current mouse position
  const cursorPoint = screen.getCursorScreenPoint()

  // Find the screen (display) that the cursor is on
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint)

  if (activeDisplay) {
    // console.log('Active screen:', activeDisplay)
    return activeDisplay
  } else {
    console.log('No active screen found.')
    return null
  }
}
ipcMain.handle('capture-screen', async () => {
  const { width, height } = screen.getPrimaryDisplay().size
  // Get the ID of the current window

  // Get the current window bounds
  // @ts-ignore
  const windowBounds = mainWindow.getBounds()

  // Find which display the window is on
  // @ts-ignore
  const displays = screen.getAllDisplays()

  const monitor = getMonitorForWindow(mainWindow)
  console.log('Monitor for window:', monitor)

  await mainWindow.hide()
  await delay(1200)

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { height, width }
  })
  console.log(sources.length)

  let screenSource = sources[0]
  // console.log('targetDisplay', targetDisplay)

  for (let source of sources) {
    console.log('source.display_id', source.display_id, monitor.id)
    if (String(source.display_id) === String(monitor.id)) {
      screenSource = source
      break
    }
  }
  if (!screenSource) {
    console.error('No matching screen found')
    return null
  }

  // Return the base64 image of the current window
  mainWindow.show()
  return screenSource.thumbnail.toDataURL()
})

// Function to get the monitor of a specific window
function getMonitorForWindow(mainWindow) {
  // Get the window's position (x, y)
  const windowBounds = mainWindow.getBounds()

  // Get all connected displays
  const displays = screen.getAllDisplays()

  // Loop through the displays to find the one that the window is on
  for (const display of displays) {
    const { x, y, width, height } = display.bounds

    // Check if the window's top-left corner (x, y) is within the display bounds
    if (
      windowBounds.x >= x &&
      windowBounds.x <= x + width &&
      windowBounds.y >= y &&
      windowBounds.y <= y + height
    ) {
      return display // This is the monitor the window is on
    }
  }

  return null // If no matching display is found (should not happen in most cases)
}
