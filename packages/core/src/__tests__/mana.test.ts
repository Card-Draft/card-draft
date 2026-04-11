import { describe, expect, it } from 'vitest'
import { normalizeManaSymbol, normalizeRulesTextSymbols, sortManaSymbols } from '../mana'

describe('mana helpers', () => {
  it('normalizes hybrid ordering for special symbols', () => {
    expect(normalizeManaSymbol('w/u')).toBe('W/U')
    expect(normalizeManaSymbol('w/p')).toBe('W/P')
    expect(normalizeManaSymbol('w/2')).toBe('2/W')
    expect(normalizeManaSymbol('w/c')).toBe('C/W')
  })

  it('sorts mana symbol runs in canonical order', () => {
    expect(sortManaSymbols(['G', 'R'])).toEqual(['R', 'G'])
    expect(sortManaSymbols(['W/U', '2', 'C'])).toEqual(['2', 'W/U', 'C'])
  })

  it('normalizes rules text symbol runs without disturbing prose', () => {
    expect(normalizeRulesTextSymbols('{g}{r}: Add {g} or {r}.')).toBe('{R}{G}: Add {G} or {R}.')
    expect(normalizeRulesTextSymbols('{tap}: Add {w/u}.')).toBe('{T}: Add {W/U}.')
  })
})
