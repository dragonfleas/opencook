import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, writeFileSync, appendFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DependencyContainer } from './presentation/bootstrap/DependencyContainer'

// Enable console logging to file in production
if (!is.dev) {
  const logPath = join(app.getPath('userData'), 'main-process.log')
  const originalConsole = { ...console }

  console.log = (...args) => {
    const message = `[${new Date().toISOString()}] LOG: ${args.join(' ')}\n`
    appendFileSync(logPath, message, { encoding: 'utf8' })
    originalConsole.log(...args)
  }

  console.error = (...args) => {
    const message = `[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`
    appendFileSync(logPath, message, { encoding: 'utf8' })
    originalConsole.error(...args)
  }

  console.warn = (...args) => {
    const message = `[${new Date().toISOString()}] WARN: ${args.join(' ')}\n`
    appendFileSync(logPath, message, { encoding: 'utf8' })
    originalConsole.warn(...args)
  }

  // Clear log file on startup
  writeFileSync(logPath, `=== OpenCook Main Process Log - ${new Date().toISOString()} ===\n`)
  console.log('Main process logging enabled. Log file:', logPath)
}

function createWindow(): void {
  // Create the browser window.
  console.log('Creating BrowserWindow with platform:', process.platform)

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: is.dev ? false : true // Disable web security in dev for localhost access
    }
  }

  // Add icon for Linux only (Windows gets icon from .exe)
  if (process.platform === 'linux') {
    windowOptions.icon = icon
  }

  console.log('Window options:', windowOptions)
  const mainWindow = new BrowserWindow(windowOptions)

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show - displaying window')
    mainWindow.show()

    // Open DevTools in development for debugging
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Enable DevTools in production with Ctrl+Shift+I
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools()
    }
  })

  // Add error handling for window loading issues
  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load window content:', {
        errorCode,
        errorDescription,
        validatedURL
      })
      // Show window anyway so user can see what's happening
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
    }
  )

  // Add timeout fallback to show window if ready-to-show doesn't fire
  setTimeout(() => {
    if (!mainWindow.isVisible()) {
      console.warn('Window not visible after 10 seconds - forcing show')
      mainWindow.show()
    }
  }, 10000)

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
      mainWindow.loadFile(htmlPath).catch((fallbackErr) => {
        console.error('Failed to load fallback file:', fallbackErr)
      })
    })
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    console.log('Loading renderer from file:', htmlPath)
    console.log('File exists:', existsSync(htmlPath))

    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load renderer file:', err)
      console.error('Attempted path:', htmlPath)
      console.error('Current working directory:', process.cwd())
      console.error('__dirname:', __dirname)
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  console.log('Electron app ready - starting initialization')

  try {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Initialize dependency container and IPC handlers
    console.log('Initializing dependency container...')
    const container = DependencyContainer.getInstance()
    await container.initialize()
    console.log('Dependency container initialized successfully')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    console.log('Creating main window...')
    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    console.error('Failed to initialize application:', error)
    // Still try to create window so user can see what's happening
    console.log('Creating window despite initialization error...')
    createWindow()
  }
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
