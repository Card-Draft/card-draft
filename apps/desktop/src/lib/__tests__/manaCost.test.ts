import { describe, expect, it } from 'vitest'
import { formatManaCostForInput, normalizeManaCostInput } from '../manaCost'

describe('normalizeManaCostInput', () => {
  it('sorts shorthand costs by official order', () => {
    expect(normalizeManaCostInput('uw2')).toBe('{2}{W}{U}')
    expect(normalizeManaCostInput('g3x')).toBe('{X}{3}{G}')
    expect(normalizeManaCostInput('cws2')).toBe('{2}{S}{W}{C}')
    expect(normalizeManaCostInput('cw')).toBe('{W}{C}')
    expect(normalizeManaCostInput('{C}{W/U}')).toBe('{W/U}{C}')
  })

  it('normalizes hybrid symbols to WUBRG order', () => {
    expect(normalizeManaCostInput('u/w2')).toBe('{2}{W/U}')
    expect(normalizeManaCostInput('{U/W}{B/R}')).toBe('{W/U}{B/R}')
  })

  it('places phyrexian after the color within a symbol', () => {
    expect(normalizeManaCostInput('p/w2')).toBe('{2}{W/P}')
  })
})

describe('formatManaCostForInput', () => {
  it('renders canonical costs as shorthand input text', () => {
    expect(formatManaCostForInput('{X}{3}{W}{U}')).toBe('X3WU')
    expect(formatManaCostForInput('{2}{W/U}{B/R}')).toBe('2W/UB/R')
  })
})
