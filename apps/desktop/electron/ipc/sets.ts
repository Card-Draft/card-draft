import electron from 'electron'
import { getDb } from '../db'
import { sets } from '@card-draft/core/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type { NewSet, UpdateSet } from '@card-draft/core/types'

const { ipcMain } = electron

export function registerSetHandlers() {
  const db = () => getDb()

  ipcMain.handle('sets:list', () => {
    return db().select().from(sets).orderBy(sets.updatedAt)
  })

  ipcMain.handle('sets:create', (_e, data: NewSet) => {
    const id = randomUUID()
    const now = new Date().toISOString()
    const row = { id, ...data, createdAt: now, updatedAt: now }
    db().insert(sets).values(row).run()
    return row
  })

  ipcMain.handle('sets:get', (_e, id: string) => {
    return db().select().from(sets).where(eq(sets.id, id)).get() ?? null
  })

  ipcMain.handle('sets:update', (_e, id: string, data: UpdateSet) => {
    const now = new Date().toISOString()
    db()
      .update(sets)
      .set({ ...data, updatedAt: now })
      .where(eq(sets.id, id))
      .run()
    return db().select().from(sets).where(eq(sets.id, id)).get()
  })

  ipcMain.handle('sets:delete', (_e, id: string) => {
    db().delete(sets).where(eq(sets.id, id)).run()
  })
}
