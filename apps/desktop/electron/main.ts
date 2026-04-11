import electron from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './db'
import { registerSetHandlers } from './ipc/sets'
import { registerCardHandlers } from './ipc/cards'
import { registerTemplateHandlers } from './ipc/templates'
import { registerExportHandlers } from './ipc/export'
import log from 'electron-log'

const currentDir = dirname(fileURLToPath(import.meta.url))
const { app, BrowserWindow, shell } = electron

log.info('Card Draft starting...')

let mainWindow: electron.BrowserWindow | null = null

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
}

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1440,
  height: 900,
  isMaximized: true,
}

function getWindowStatePath() {
  return join(app.getPath('userData'), 'window-state.json')
}

function readWindowState(): WindowState {
  const statePath = getWindowStatePath()

  try {
    if (!existsSync(statePath)) return DEFAULT_WINDOW_STATE

    const parsed = JSON.parse(readFileSync(statePath, 'utf8')) as Partial<WindowState>

    return {
      width: parsed.width && parsed.width >= 900 ? parsed.width : DEFAULT_WINDOW_STATE.width,
      height: parsed.height && parsed.height >= 600 ? parsed.height : DEFAULT_WINDOW_STATE.height,
      isMaximized: parsed.isMaximized ?? DEFAULT_WINDOW_STATE.isMaximized,
      ...(typeof parsed.x === 'number' ? { x: parsed.x } : {}),
      ...(typeof parsed.y === 'number' ? { y: parsed.y } : {}),
    }
  } catch (error) {
    log.warn('Failed to read window state, using defaults', error)
    return DEFAULT_WINDOW_STATE
  }
}

function writeWindowState(window: electron.BrowserWindow) {
  try {
    const statePath = getWindowStatePath()
    mkdirSync(dirname(statePath), { recursive: true })

    const normalBounds = window.isMaximized() ? window.getNormalBounds() : window.getBounds()
    const state: WindowState = {
      width: Math.max(900, Math.round(normalBounds.width)),
      height: Math.max(600, Math.round(normalBounds.height)),
      x: normalBounds.x,
      y: normalBounds.y,
      isMaximized: window.isMaximized(),
    }

    writeFileSync(statePath, JSON.stringify(state, null, 2))
  } catch (error) {
    log.warn('Failed to write window state', error)
  }
}

function createWindow() {
  const windowState = readWindowState()

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    ...(typeof windowState.x === 'number' ? { x: windowState.x } : {}),
    ...(typeof windowState.y === 'number' ? { y: windowState.y } : {}),
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#18181b', // zinc-900
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(currentDir, '../preload/preload.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    if (windowState.isMaximized) {
      mainWindow?.maximize()
    }
    mainWindow?.show()
  })

  let persistWindowStateTimeout: NodeJS.Timeout | null = null
  const schedulePersistWindowState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    if (persistWindowStateTimeout) {
      clearTimeout(persistWindowStateTimeout)
    }

    persistWindowStateTimeout = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      writeWindowState(mainWindow)
    }, 150)
  }

  mainWindow.on('resize', schedulePersistWindowState)
  mainWindow.on('move', schedulePersistWindowState)
  mainWindow.on('maximize', schedulePersistWindowState)
  mainWindow.on('unmaximize', schedulePersistWindowState)
  mainWindow.on('close', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    writeWindowState(mainWindow)
  })

  // Open external links in the default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(currentDir, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  // Init DB first so IPC handlers can use it
  initDatabase()

  registerSetHandlers()
  registerCardHandlers()
  registerTemplateHandlers()
  registerExportHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
