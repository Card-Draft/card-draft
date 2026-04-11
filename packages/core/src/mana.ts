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

const SYMBOL_ALIASES: Record<string, string> = {
  TAP: 'T',
  UNTAP: 'Q',
}

const NON_COST_SYMBOLS = new Set(['T', 'Q', 'CHAOS'])

function symbolOrder(symbol: string) {
  if (/^\d+$/.test(symbol)) return -2
  if (symbol === 'C') return -1
  if (symbol in COLOR_ORDER) return COLOR_ORDER[symbol] ?? 999
  if (symbol === 'P') return 999
  return 500
}

export function normalizeSymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase()
  return SYMBOL_ALIASES[normalized] ?? normalized
}

export function normalizeHybridSymbol(symbol: string) {
  const parts = symbol.split('/').map(normalizeSymbol).filter(Boolean)
  if (parts.length !== 2) return normalizeSymbol(symbol)

  return [...parts]
    .sort((left, right) => symbolOrder(left) - symbolOrder(right) || left.localeCompare(right))
    .join('/')
}

export function normalizeManaSymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol)
  if (normalized.includes('/')) return normalizeHybridSymbol(normalized)
  return normalized
}

export function manaSortKey(symbol: string): [number, number, number, string] {
  const normalized = normalizeManaSymbol(symbol)

  if (normalized === '½') return [0, 0, 0, normalized]
  if (normalized === 'X') return [1, 0, 0, normalized]
  if (/^\d+$/.test(normalized)) return [2, Number(normalized), 0, normalized]
  if (normalized === 'P') return [3, 0, 0, normalized]
  if (normalized === 'S') return [4, 0, 0, normalized]
  if (normalized in COLOR_ORDER) return [5, COLOR_ORDER[normalized] ?? 999, 0, normalized]

  if (normalized.includes('/')) {
    const [left = '', right = ''] = normalized.split('/')
    return [6, symbolOrder(left), symbolOrder(right), normalized]
  }

  if (normalized === 'C') return [7, 0, 0, normalized]

  return [8, 999, 999, normalized]
}

export function sortManaSymbols(symbols: string[]) {
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

export function isManaCostSymbol(symbol: string) {
  const normalized = normalizeManaSymbol(symbol)
  if (!normalized || NON_COST_SYMBOLS.has(normalized)) return false
  if (normalized === 'INFINITY' || normalized === '∞') return true
  if (normalized === '½') return true
  if (/^\d+$/.test(normalized)) return true
  if (normalized.includes('/')) return true
  return normalized === 'P' || normalized === 'S' || normalized === 'C' || normalized === 'X' || normalized === 'Y' || normalized === 'Z' || normalized === 'E' || normalized in COLOR_ORDER
}

export function normalizeRulesTextSymbols(input: string) {
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

  const output: string[] = []

  for (let index = 0; index < tokens.length; ) {
    const token = tokens[index]

    if (!token) break

    if (token.kind !== 'symbol' || !isManaCostSymbol(token.value)) {
      output.push(token.kind === 'symbol' ? `{${token.value}}` : token.value)
      index += 1
      continue
    }

    const run: string[] = []
    let cursor = index

    while (cursor < tokens.length) {
      const candidate = tokens[cursor]
      if (!candidate || candidate.kind !== 'symbol' || !isManaCostSymbol(candidate.value)) break
      run.push(candidate.value)
      cursor += 1
    }

    output.push(...sortManaSymbols(run).map((symbol) => `{${symbol}}`))
    index = cursor
  }

  return output.join('')
}
