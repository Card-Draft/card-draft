import { describe, expect, it } from 'vitest'
import { tokenizeManaText } from '../manaTokenize'

describe('ManaText tokenize', () => {
  it('parses complete mana symbols', () => {
    expect(tokenizeManaText('{W}{2}')).toEqual([
      { kind: 'symbol', value: 'W' },
      { kind: 'symbol', value: '2' },
    ])
  })

  it('treats incomplete mana input as literal text', () => {
    expect(tokenizeManaText('{')).toEqual([{ kind: 'text', value: '{' }])
    expect(tokenizeManaText('{W')).toEqual([
      { kind: 'text', value: '{' },
      { kind: 'text', value: 'W' },
    ])
  })
})
