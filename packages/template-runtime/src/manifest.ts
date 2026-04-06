import { z } from 'zod'
import type { TemplateManifest } from '@card-draft/core/types'

const FieldDefinitionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'richtext', 'mana', 'image', 'select', 'number', 'color']),
  label: z.string().min(1),
  required: z.boolean().optional(),
  italic: z.boolean().optional(),
  conditional: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
})

export const ManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'name must be lowercase kebab-case'),
  displayName: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version must be semver'),
  game: z.string().min(1),
  author: z.string().min(1),
  cardSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['in', 'mm', 'px']),
  }),
  fields: z.array(FieldDefinitionSchema).min(1),
})

/**
 * Validate and parse a raw manifest JSON object.
 * Throws a ZodError with descriptive messages if invalid.
 */
export function validateManifest(raw: unknown): TemplateManifest {
  return ManifestSchema.parse(raw) as TemplateManifest
}
