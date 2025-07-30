import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DependencyContainer } from './presentation/bootstrap/DependencyContainer'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: is.dev ? false : true // Disable web security in dev for localhost access
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // Open DevTools in development for debugging
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  console.log('Development mode:', is.dev)
  console.log('ELECTRON_RENDERER_URL:', process.env['ELECTRON_RENDERER_URL'])

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const rendererUrl = process.env['ELECTRON_RENDERER_URL']
    console.log('Loading renderer from URL:', rendererUrl)

    mainWindow.loadURL(rendererUrl).catch((err) => {
      console.error('Failed to load renderer URL:', err)
      // Fallback to local file
      const htmlPath = join(__dirname, '../renderer/index.html')
      console.log('Falling back to local file:', htmlPath)
      mainWindow.loadFile(htmlPath)
    })
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    console.log('Loading renderer from file:', htmlPath)
    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load renderer file:', err)
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Initialize dependency container and IPC handlers
  const container = DependencyContainer.getInstance()
  await container.initialize()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // Clean up resources
  const container = DependencyContainer.getInstance()
  await container.cleanup()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
