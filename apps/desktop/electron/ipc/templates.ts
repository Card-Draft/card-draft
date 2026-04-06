import electron from 'electron'
import { getDb } from '../db'
import { templates } from '@card-draft/core/db/schema'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { cpSync, existsSync, readFileSync } from 'fs'
import { validateManifest } from '@card-draft/template-runtime/manifest'
import log from 'electron-log'

const { ipcMain, app, dialog } = electron

export function registerTemplateHandlers() {
  const db = () => getDb()

  ipcMain.handle('templates:list', () => {
    return db().select().from(templates).all()
  })

  ipcMain.handle('templates:installFromFolder', (_e, folderPath: string) => {
    const manifestPath = join(folderPath, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error('No manifest.json found in folder')
    }

    const manifestRaw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as unknown
    const manifest = validateManifest(manifestRaw) // throws if invalid

    // Copy template folder to userData/templates/
    const dest = join(app.getPath('userData'), 'templates', manifest.name)
    cpSync(folderPath, dest, { recursive: true })

    const id = randomUUID()
    const row = {
      id,
      packageName: manifest.name,
      version: manifest.version,
      gameId: manifest.game,
      displayName: manifest.displayName,
      manifestJson: JSON.stringify(manifest),
      installedPath: dest,
    }
    db().insert(templates).values(row).run()
    log.info(`Template installed: ${manifest.displayName} → ${dest}`)
    return row
  })

  ipcMain.handle('dialog:openFile', async (_e, options: { filters?: Electron.FileFilter[] }) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], ...options })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle('dialog:readFileAsDataUrl', (_e, filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase()

    // SVGs are text — encode as UTF-8 data URL so browsers and Konva handle them correctly
    if (ext === 'svg') {
      const text = readFileSync(filePath, 'utf-8')
      const encoded = encodeURIComponent(text)
      return `data:image/svg+xml,${encoded}`
    }

    const mimeType =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'gif'
              ? 'image/gif'
              : 'application/octet-stream'

    const bytes = readFileSync(filePath)
    return `data:${mimeType};base64,${bytes.toString('base64')}`
  })
}
