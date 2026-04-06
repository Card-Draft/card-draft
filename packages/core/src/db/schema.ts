import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  game: text('game').notNull().default('magic'),
  templateId: text('template_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  // JSON blob for flexible set-level metadata (set symbol, code, etc.)
  metadata: text('metadata').notNull().default('{}'),
})

export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    // Position within the set (0-indexed)
    index: integer('index').notNull().default(0),
    templateId: text('template_id').notNull(),
    // JSON blob of field values, typed by the template's Zod schema
    fields: text('fields').notNull().default('{}'),
    // Absolute path to the card art image on disk, or null
    artPath: text('art_path'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('cards_set_id_idx').on(table.setId)],
)

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  packageName: text('package_name').notNull().unique(),
  version: text('version').notNull(),
  gameId: text('game_id').notNull(),
  displayName: text('display_name').notNull(),
  // Full manifest JSON cached here for offline access
  manifestJson: text('manifest_json').notNull(),
  // Absolute path to the installed template folder
  installedPath: text('installed_path').notNull(),
})

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  // JSON blob describing the game's default field schema
  fieldSchema: text('field_schema').notNull().default('[]'),
})
