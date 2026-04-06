import electron from 'electron'
import { getDb } from '../db'
import { cards } from '@card-draft/core/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type { NewCard, UpdateCard } from '@card-draft/core/types'

const { ipcMain } = electron

export function registerCardHandlers() {
  const db = () => getDb()

  ipcMain.handle('cards:list', (_e, setId: string) => {
    return db().select().from(cards).where(eq(cards.setId, setId)).orderBy(asc(cards.index))
  })

  ipcMain.handle('cards:create', (_e, data: NewCard) => {
    const id = randomUUID()
    const now = new Date().toISOString()
    // Get max index for this set
    const existing = db()
      .select()
      .from(cards)
      .where(eq(cards.setId, data.setId))
      .orderBy(asc(cards.index))
      .all()
    const nextIndex = existing.length
    const row = { id, ...data, index: nextIndex, createdAt: now }
    db().insert(cards).values(row).run()
    return row
  })

  ipcMain.handle('cards:get', (_e, id: string) => {
    return db().select().from(cards).where(eq(cards.id, id)).get() ?? null
  })

  ipcMain.handle('cards:update', (_e, id: string, data: UpdateCard) => {
    db().update(cards).set(data).where(eq(cards.id, id)).run()
    return db().select().from(cards).where(eq(cards.id, id)).get()
  })

  ipcMain.handle('cards:delete', (_e, id: string) => {
    db().delete(cards).where(eq(cards.id, id)).run()
  })

  ipcMain.handle('cards:reorder', (_e, setId: string, orderedIds: string[]) => {
    // Use a transaction for atomic reorder
    db().transaction(() => {
      orderedIds.forEach((id, index) => {
        db().update(cards).set({ index }).where(eq(cards.id, id)).run()
      })
    })
    void setId
  })
}
