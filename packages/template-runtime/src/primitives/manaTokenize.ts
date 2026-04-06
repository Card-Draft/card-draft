interface TextToken {
  kind: 'text'
  value: string
}

interface SymbolToken {
  kind: 'symbol'
  value: string
}

export type ManaToken = TextToken | SymbolToken

export function tokenizeManaText(input: string): ManaToken[] {
  const tokens: ManaToken[] = []
  let remaining = input

  while (remaining.length > 0) {
    const match = /^\{([^}]+)\}/.exec(remaining)

    if (match) {
      tokens.push({ kind: 'symbol', value: match[1] ?? '' })
      remaining = remaining.slice(match[0].length)
      continue
    }

    const end = remaining.indexOf('{')
    if (end === 0) {
      // Treat unmatched/incomplete braces as literal text while the user is typing.
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
