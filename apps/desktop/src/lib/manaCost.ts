export type ManaToken =
  | { kind: 'text'; value: string }
  | { kind: 'symbol'; value: string }

const COLOR_ORDER: Record<string, number> = {
  W: 0,
  U: 1,
  B: 2,
  R: 3,
  G: 4,
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

function normalizeHybridSymbol(symbol: string) {
  const parts = symbol.split('/').map(normalizeSymbol).filter(Boolean)
  if (parts.length !== 2) return normalizeSymbol(symbol)

  return [...parts]
    .sort((left, right) => {
      if (left === 'P') return 1
      if (right === 'P') return -1
      return (COLOR_ORDER[left] ?? 999) - (COLOR_ORDER[right] ?? 999) || left.localeCompare(right)
    })
    .join('/')
}

function normalizeManaSymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol)
  if (normalized.includes('/')) return normalizeHybridSymbol(normalized)
  return normalized
}

function manaSortKey(symbol: string): [number, number, number, string] {
  const normalized = normalizeManaSymbol(symbol)

  if (normalized === '½') return [0, 0, 0, normalized]
  if (normalized === 'X') return [1, 0, 0, normalized]
  if (/^\d+$/.test(normalized)) return [2, Number(normalized), 0, normalized]
  if (normalized === 'P') return [3, 0, 0, normalized]
  if (normalized === 'S') return [4, 0, 0, normalized]
  if (normalized in COLOR_ORDER) return [5, COLOR_ORDER[normalized] ?? 999, 0, normalized]

  if (normalized.includes('/')) {
    const [left = '', right = ''] = normalized.split('/')
    return [6, COLOR_ORDER[left] ?? 999, COLOR_ORDER[right] ?? (right === 'P' ? 998 : 999), normalized]
  }

  if (normalized === 'C') return [7, 0, 0, normalized]

  return [8, 999, 999, normalized]
}

function sortSymbols(symbols: string[]) {
  return [...symbols].sort((left, right) => {
    const leftKey = manaSortKey(left)
    const rightKey = manaSortKey(right)

    for (let index = 0; index < leftKey.length; index += 1) {
      const comparison =
        typeof leftKey[index] === 'number' && typeof rightKey[index] === 'number'
          ? Number(leftKey[index]) - Number(rightKey[index])
          : String(leftKey[index]).localeCompare(String(rightKey[index]))

      if (comparison !== 0) return comparison
    }

    return 0
  })
}

export function tokenizeCanonicalManaCost(input: string): ManaToken[] {
  const tokens: ManaToken[] = []
  let remaining = input

  while (remaining.length > 0) {
    const match = /^\{([^}]+)\}/.exec(remaining)

    if (match) {
      tokens.push({ kind: 'symbol', value: normalizeManaSymbol(match[1] ?? '') })
      remaining = remaining.slice(match[0].length)
      continue
    }

    const end = remaining.indexOf('{')
    if (end === 0) {
      tokens.push({ kind: 'text', value: remaining[0] ?? '' })
      remaining = remaining.slice(1)
      continue
    }

    const text = end === -1 ? remaining : remaining.slice(0, end)
    tokens.push({ kind: 'text', value: text })
    remaining = end === -1 ? '' : remaining.slice(end)
  }

  return tokens
}

function parseShorthandManaCost(input: string) {
  const raw = input.toUpperCase().replace(/[^0-9WUBRGCXP\/S½]/g, '')
  const symbols: string[] = []

  for (let index = 0; index < raw.length; ) {
    const char = raw[index]

    if (!char) break

    if (/\d/.test(char)) {
      let end = index + 1
      while (end < raw.length && /\d/.test(raw[end] ?? '')) end += 1
      symbols.push(raw.slice(index, end))
      index = end
      continue
    }

    if (char === '½') {
      symbols.push(char)
      index += 1
      continue
    }

    const next = raw[index + 1]
    const nextNext = raw[index + 2]
    if (
      next === '/' &&
      nextNext &&
      /[WUBRGCPS]/.test(char) &&
      /[WUBRGP]/.test(nextNext)
    ) {
      symbols.push(normalizeHybridSymbol(`${char}/${nextNext}`))
      index += 3
      continue
    }

    if (/[WUBRGCXPS]/.test(char)) {
      symbols.push(char)
    }

    index += 1
  }

  return sortSymbols(symbols)
}

function parseCanonicalSymbols(input: string) {
  const symbols = tokenizeCanonicalManaCost(input)
    .filter((token): token is Extract<ManaToken, { kind: 'symbol' }> => token.kind === 'symbol')
    .map((token) => normalizeManaSymbol(token.value))

  return sortSymbols(symbols)
}

export function normalizeManaCostInput(input: string) {
  const symbols = input.includes('{') ? parseCanonicalSymbols(input) : parseShorthandManaCost(input)
  return symbols.map((symbol) => `{${symbol}}`).join('')
}

export function formatManaCostForInput(input: string) {
  return parseCanonicalSymbols(input).join('')
}
