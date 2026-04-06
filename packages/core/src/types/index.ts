// Re-export all inferred types from the Drizzle schema

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type { sets, cards, templates, games } from '../db/schema'

export type CardDraftSet = InferSelectModel<typeof sets>
export type NewSet = Omit<InferInsertModel<typeof sets>, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSet = Partial<Omit<NewSet, 'game'>>

export type Card = InferSelectModel<typeof cards>
export type NewCard = Omit<InferInsertModel<typeof cards>, 'id' | 'index' | 'createdAt'>
export type UpdateCard = Partial<Omit<NewCard, 'setId'>>

export type InstalledTemplate = InferSelectModel<typeof templates>
export type Game = InferSelectModel<typeof games>

// Template manifest field types
export type FieldType = 'text' | 'richtext' | 'mana' | 'image' | 'select' | 'number' | 'color'

export interface FieldDefinition {
  id: string
  type: FieldType
  label: string
  required?: boolean
  italic?: boolean
  conditional?: string // name of a logic function that returns boolean
  options?: string[] // for 'select' type
  defaultValue?: string
}

export interface TemplateManifest {
  name: string
  displayName: string
  version: string
  game: string
  author: string
  cardSize: { width: number; height: number; unit: 'in' | 'mm' | 'px' }
  fields: FieldDefinition[]
}
