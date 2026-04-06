import { drizzle } from 'drizzle-orm/better-sqlite3'
import electron from 'electron'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '@card-draft/core/db/schema'
import log from 'electron-log'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import type BetterSqlite3Constructor from 'better-sqlite3'

let _db: ReturnType<typeof drizzle> | null = null
const currentDir = dirname(fileURLToPath(import.meta.url))
const { app } = electron
const require = createRequire(import.meta.url)
const BetterSqlite3 = require('better-sqlite3') as typeof BetterSqlite3Constructor

function bootstrapSchema(sqlite: BetterSqlite3Constructor.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      game TEXT NOT NULL DEFAULT 'magic',
      template_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      set_id TEXT NOT NULL,
      "index" INTEGER NOT NULL DEFAULT 0,
      template_id TEXT NOT NULL,
      fields TEXT NOT NULL DEFAULT '{}',
      art_path TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS cards_set_id_idx ON cards (set_id);

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      package_name TEXT NOT NULL UNIQUE,
      version TEXT NOT NULL,
      game_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      installed_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      field_schema TEXT NOT NULL DEFAULT '[]'
    );
  `)
}

export function initDatabase() {
  const dbPath = join(app.getPath('userData'), 'card-draft.db')
  const builtMigrations = join(currentDir, '../../node_modules/@card-draft/core/dist/db/migrations')
  const sourceMigrations = join(currentDir, '../../../packages/core/src/db/migrations')
  const builtJournal = join(builtMigrations, 'meta/_journal.json')
  const sourceJournal = join(sourceMigrations, 'meta/_journal.json')
  log.info(`Opening database at ${dbPath}`)

  const sqlite = new BetterSqlite3(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })

  // Drizzle requires a journal file; skip migrations in dev until they exist.
  if (existsSync(builtJournal) || existsSync(sourceJournal)) {
    migrate(_db, {
      migrationsFolder: existsSync(builtJournal) ? builtMigrations : sourceMigrations,
    })
  } else {
    log.warn('Skipping migrations: no Drizzle migration journal found')
    bootstrapSchema(sqlite)
  }

  log.info('Database ready')
}

export function getDb() {
  if (!_db) throw new Error('Database not initialized — call initDatabase() first')
  return _db
}
