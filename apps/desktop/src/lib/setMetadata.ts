export interface SetMetadata extends Record<string, string | undefined> {
  rarityIcon?: string
}

export function parseSetMetadata(serialized: string | null | undefined): SetMetadata {
  if (!serialized) return {}

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ) as SetMetadata
  } catch {
    return {}
  }
}

export function serializeSetMetadata(metadata: SetMetadata): string {
  return JSON.stringify(metadata)
}
