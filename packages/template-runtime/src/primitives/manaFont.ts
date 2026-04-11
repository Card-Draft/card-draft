export interface ManaFontGlyphs {
  before: string | null
  after: string | null
}

export interface ManaCostBackground {
  kind: 'solid' | 'split'
  colors: [string] | [string, string]
}

const COST_NEUTRAL = '#beb9b2'
const COST_COLORS: Record<string, string> = {
  '2': COST_NEUTRAL,
  W: '#f0f2c0',
  U: '#b5cde3',
  B: '#aca29a',
  R: '#db8664',
  G: '#93b483',
  C: '#d0c6bb',
}

const CLASS_NAME_ALIASES: Record<string, string> = {
  '1/2': '1-2',
  '½': '1-2',
  T: 'tap',
  Q: 'untap',
  INFINITY: 'infinity',
  '∞': 'infinity',
}

const FALLBACK_ASSET_ALIASES: Record<string, string> = {
  T: 't',
}

const PLAIN_SYMBOLS = new Set(['T', 'Q', 'CHAOS'])
const COST_SINGLE_SYMBOLS = new Set(['W', 'U', 'B', 'R', 'G', 'C', 'X', 'Y', 'Z', 'S', 'E', 'H', 'P'])
const glyphCache = new Map<string, ManaFontGlyphs | null>()

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

function decodeCssContent(content: string) {
  return content.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  )
}

function normalizePseudoContent(content: string) {
  if (!content || content === 'none' || content === 'normal') return null

  const trimmed = content.trim()
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed

  if (!unquoted) return null
  return decodeCssContent(unquoted)
}

function ensureGlyphProbeNode() {
  if (typeof document === 'undefined') return null

  let node = document.getElementById('card-draft-mana-glyph-probe')
  if (node) return node

  node = document.createElement('span')
  node.id = 'card-draft-mana-glyph-probe'
  node.setAttribute(
    'style',
    'position:absolute;left:-9999px;top:-9999px;pointer-events:none;visibility:hidden;line-height:1;',
  )
  document.body.appendChild(node)
  return node
}

export function getManaFontClassName(symbol: string) {
  const normalized = normalizeSymbol(symbol)
  if (!normalized) return null

  const aliased = CLASS_NAME_ALIASES[normalized]
  if (aliased) return aliased

  return normalized.toLowerCase().replace(/½/g, '1-2').replace(/\//g, '')
}

export function isManaCostSymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol)

  if (!normalized || PLAIN_SYMBOLS.has(normalized)) return false
  if (/^\d+$/.test(normalized)) return true
  if (normalized.includes('/')) return true
  if (normalized === '1/2' || normalized === '½' || normalized === 'INFINITY' || normalized === '∞') return true

  return COST_SINGLE_SYMBOLS.has(normalized)
}

export function buildManaSymbolAssetPath(symbolBasePath: string, symbol: string) {
  const normalized = normalizeSymbol(symbol)
  const assetName =
    FALLBACK_ASSET_ALIASES[normalized] ??
    normalized.toLowerCase().replace(/½/g, 'half').replace(/\//g, '')

  return `${symbolBasePath}/${assetName}.svg`
}

export function getManaCostBackground(symbol: string): ManaCostBackground {
  const normalized = normalizeSymbol(symbol)

  if (!normalized) {
    return { kind: 'solid', colors: [COST_NEUTRAL] }
  }

  if (/^\d+$/.test(normalized) || normalized === '1/2' || normalized === '½' || normalized === 'INFINITY' || normalized === '∞') {
    return { kind: 'solid', colors: [COST_NEUTRAL] }
  }

  if (!normalized.includes('/')) {
    return { kind: 'solid', colors: [COST_COLORS[normalized] ?? COST_NEUTRAL] }
  }

  const parts = normalized.split('/').filter(Boolean)
  const nonPhyrexianParts = parts.filter((part) => part !== 'P')

  if (nonPhyrexianParts.length <= 1) {
    return { kind: 'solid', colors: [COST_COLORS[nonPhyrexianParts[0] ?? ''] ?? COST_NEUTRAL] }
  }

  const top = COST_COLORS[nonPhyrexianParts[0] ?? ''] ?? COST_NEUTRAL
  const bottom = COST_COLORS[nonPhyrexianParts[1] ?? ''] ?? COST_NEUTRAL

  return { kind: 'split', colors: [top, bottom] }
}

export function resolveManaFontGlyphs(symbol: string): ManaFontGlyphs | null {
  const className = getManaFontClassName(symbol)
  if (!className) return null

  const cached = glyphCache.get(className)
  if (cached !== undefined) return cached

  const probe = ensureGlyphProbeNode()
  if (!probe || typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return null
  }

  probe.className = `ms ms-${className}`

  const glyphs = {
    before: normalizePseudoContent(window.getComputedStyle(probe, '::before').content),
    after: normalizePseudoContent(window.getComputedStyle(probe, '::after').content),
  }

  const resolved = glyphs.before || glyphs.after ? glyphs : null
  if (resolved) {
    glyphCache.set(className, resolved)
  }
  return resolved
}
