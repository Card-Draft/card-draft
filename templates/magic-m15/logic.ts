/**
 * Magic M15 template logic.
 *
 * These functions are available both locally (imported by template.tsx)
 * and as the sandboxed module executed at runtime for conditional field display.
 *
 * The SES sandbox injects: parseManaCost, symbolsInCost, includesType, fields
 */

import type { M15Fields } from './fields'

export function isCreature(fields: M15Fields): boolean {
  return fields.type.toLowerCase().includes('creature')
}

export function isLand(fields: M15Fields): boolean {
  return fields.type.toLowerCase().includes('land')
}

export function isPlaneswalker(fields: M15Fields): boolean {
  return fields.type.toLowerCase().includes('planeswalker')
}

/** Returns the frame color key to use for selecting the right SVG frame asset */
export type FrameColor =
  | 'white'
  | 'blue'
  | 'black'
  | 'red'
  | 'green'
  | 'gold'
  | 'colorless'
  | 'land'

const MANA_TO_FRAME_COLOR: Record<string, Extract<FrameColor, 'white' | 'blue' | 'black' | 'red' | 'green'>> = {
  W: 'white',
  U: 'blue',
  B: 'black',
  R: 'red',
  G: 'green',
}

function manaColors(fields: M15Fields) {
  const colors = new Set<FrameColor>()
  const matches = fields.manaCost.match(/\{([^}]+)\}/g) ?? []

  for (const match of matches) {
    const symbol = match.slice(1, -1).toUpperCase()
    const parts = symbol.split('/')

    for (const part of parts) {
      const mapped = MANA_TO_FRAME_COLOR[part]
      if (mapped) {
        colors.add(mapped)
      }
    }
  }

  return colors
}

export function inferredFrameColor(fields: M15Fields): FrameColor {
  if (isLand(fields)) return 'land'

  const colors = manaColors(fields)
  if (colors.size === 0) return 'colorless'
  if (colors.size > 1) return 'gold'

  return [...colors][0] ?? 'colorless'
}

export function frameColor(fields: M15Fields): FrameColor {
  if (fields.color === 'land') return 'land'
  if (fields.color && fields.color !== 'colorless') return fields.color as FrameColor
  return inferredFrameColor(fields)
}

/** Builds the full type line string */
export function typeLine(fields: M15Fields): string {
  const parts: string[] = []
  if (fields.supertype) parts.push(fields.supertype)
  if (fields.type) parts.push(fields.type)
  const base = parts.join(' ')
  if (fields.subtype) return `${base} — ${fields.subtype}`
  return base
}

/** Frame color → hex fill for the title/type bars */
export const FRAME_COLORS: Record<FrameColor, string> = {
  white: '#f0ede0',
  blue: '#b3c9e3',
  black: '#2d2d2d',
  red: '#e3a07a',
  green: '#7db57d',
  gold: '#d4af37',
  colorless: '#b0b0b0',
  land: '#8fbc8f',
}

/** Rarity gem colors */
export const RARITY_COLORS: Record<string, string> = {
  common: '#b0b0b0',
  uncommon: '#9ec0d3',
  rare: '#d4af37',
  mythic: '#e07840',
}
