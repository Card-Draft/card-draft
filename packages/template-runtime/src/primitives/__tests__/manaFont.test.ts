import { describe, expect, it } from 'vitest'
import { getManaCostBackground, getManaFontClassName, isManaCostSymbol } from '../manaFont'

describe('manaFont helpers', () => {
  it('maps canonical symbols to mana-font class names', () => {
    expect(getManaFontClassName('W')).toBe('w')
    expect(getManaFontClassName('W/U')).toBe('wu')
    expect(getManaFontClassName('2/W')).toBe('2w')
    expect(getManaFontClassName('W/P')).toBe('wp')
    expect(getManaFontClassName('T')).toBe('tap')
    expect(getManaFontClassName('Q')).toBe('untap')
    expect(getManaFontClassName('1/2')).toBe('1-2')
  })

  it('distinguishes cost symbols from plain card symbols', () => {
    expect(isManaCostSymbol('W')).toBe(true)
    expect(isManaCostSymbol('W/U')).toBe(true)
    expect(isManaCostSymbol('1')).toBe(true)
    expect(isManaCostSymbol('T')).toBe(false)
    expect(isManaCostSymbol('CHAOS')).toBe(false)
  })

  it('builds split backgrounds for hybrid symbols', () => {
    expect(getManaCostBackground('W').kind).toBe('solid')
    expect(getManaCostBackground('W/U')).toEqual({
      kind: 'split',
      colors: ['#f0f2c0', '#b5cde3'],
    })
    expect(getManaCostBackground('W/P')).toEqual({
      kind: 'solid',
      colors: ['#f0f2c0'],
    })
  })
})
