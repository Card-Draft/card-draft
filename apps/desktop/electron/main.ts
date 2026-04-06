import electron from 'electron'
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
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
    mainWindow?.show()
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
