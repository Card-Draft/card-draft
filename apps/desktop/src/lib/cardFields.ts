import manifest from '@card-draft/templates/magic-m15/manifest.json'
import type { FieldDefinition } from '@card-draft/core/types'

const manifestFields = manifest.fields as FieldDefinition[]
const ART_CROP_MIN = 0.05

export interface ArtCropValues {
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

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

function parseFraction(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getArtCropValues(
  fields?: Partial<Record<string, string | undefined>> | null,
): ArtCropValues {
  const cropWidth = clamp(parseFraction(fields?.artCropWidth, 1), ART_CROP_MIN, 1)
  const cropHeight = clamp(parseFraction(fields?.artCropHeight, 1), ART_CROP_MIN, 1)
  const cropX = clamp(parseFraction(fields?.artCropX, 0), 0, 1 - cropWidth)
  const cropY = clamp(parseFraction(fields?.artCropY, 0), 0, 1 - cropHeight)

  return { cropX, cropY, cropWidth, cropHeight }
}

export function formatFieldNumber(value: number): string {
  return Number(value.toFixed(4)).toString()
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
