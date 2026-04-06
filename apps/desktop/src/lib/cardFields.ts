import manifest from '@card-draft/templates/magic-m15/manifest.json'
import type { FieldDefinition } from '@card-draft/core/types'

const manifestFields = manifest.fields as FieldDefinition[]

export function getDefaultFieldValues(): Record<string, string> {
  return Object.fromEntries(
    manifestFields.map((field) => [field.id, field.defaultValue ?? '']),
  )
}

export function parseCardFields(serialized: string | null | undefined): Record<string, string> {
  if (!serialized) {
    return {}
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    )
  } catch {
    return {}
  }
}

export function getMergedFieldValues(
  overrides?: Record<string, string> | null,
): Record<string, string> {
  return {
    ...getDefaultFieldValues(),
    ...(overrides ?? {}),
  }
}

export function getDisplayName(serialized: string | null | undefined, fallback: string): string {
  const fields = getMergedFieldValues(parseCardFields(serialized))
  return (fields.name ?? '').trim() || fallback
}

export function getDisplayType(serialized: string | null | undefined): string {
  const fields = getMergedFieldValues(parseCardFields(serialized))
  const parts = [fields.supertype, fields.type].filter(Boolean)
  return parts.join(' ') || 'Card'
}
