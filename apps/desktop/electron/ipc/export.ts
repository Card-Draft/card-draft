import electron from 'electron'
import { writeFileSync } from 'fs'
import type { ExportPngOptions } from '../../src/lib/ipc-types'
import log from 'electron-log'

const { ipcMain, dialog } = electron

export function registerExportHandlers() {
  // PNG export: renderer sends base64 data URL, main writes file
  ipcMain.handle(
    'export:png',
    (_e, { dataUrl, outputPath }: ExportPngOptions & { dataUrl: string }) => {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
      writeFileSync(outputPath, Buffer.from(base64, 'base64'))
      log.info(`PNG exported to ${outputPath}`)
    },
  )

  // PDF export: renderer sends PDF bytes, main writes file
  ipcMain.handle('export:pdf', (_e, { pdfBytes, outputPath }: { pdfBytes: Uint8Array; outputPath: string }) => {
    writeFileSync(outputPath, Buffer.from(pdfBytes))
    log.info(`PDF exported to ${outputPath}`)
  })

  ipcMain.handle(
    'export:pickSaveFile',
    async (_e, { defaultName, ext }: { defaultName: string; ext: string }) => {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      })
      return result.canceled ? null : result.filePath
    },
  )

  ipcMain.handle('export:pickFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })
}
