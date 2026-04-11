import {
  normalizeManaSymbol,
  sortManaSymbols,
  type ManaToken,
  tokenizeCanonicalManaCost,
} from '@card-draft/core'

function parseShorthandManaCost(input: string) {
  const raw = input.toUpperCase().replace(/[^0-9WUBRGCXP/S½]/g, '')
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
      symbols.push(normalizeManaSymbol(`${char}/${nextNext}`))
      index += 3
      continue
    }

    if (/[WUBRGCXPS]/.test(char)) {
      symbols.push(char)
    }

    index += 1
  }

  return sortManaSymbols(symbols)
}

function parseCanonicalSymbols(input: string) {
  const symbols = tokenizeCanonicalManaCost(input)
    .filter((token): token is Extract<ManaToken, { kind: 'symbol' }> => token.kind === 'symbol')
    .map((token) => normalizeManaSymbol(token.value))

  return sortManaSymbols(symbols)
}

export function normalizeManaCostInput(input: string) {
  const symbols = input.includes('{') ? parseCanonicalSymbols(input) : parseShorthandManaCost(input)
  return symbols.map((symbol) => `{${symbol}}`).join('')
}

export function formatManaCostForInput(input: string) {
  return parseCanonicalSymbols(input).join('')
}

export { tokenizeCanonicalManaCost }
