import { describe, it, expect } from 'vitest'
import { frameColor, isCreature, isLand, manaFrameColors, multicolorFrameGradient, typeLine } from '../logic'
import type { M15Fields } from '../fields'

function makeFields(overrides: Partial<M15Fields> = {}): M15Fields {
  return {
    name: 'Test Card',
    manaCost: '',
    color: 'auto',
    supertype: '',
    type: 'Instant',
    subtype: '',
    artCropX: '0',
    artCropY: '0',
    artCropWidth: '1',
    artCropHeight: '1',
    rulesText: '',
    flavorText: '',
    power: '',
    toughness: '',
    rarity: 'common',
    artist: '',
    collectorNumber: '1',
    ...overrides,
  }
}

describe('isCreature', () => {
  it('returns true for creatures', () => {
    expect(isCreature(makeFields({ type: 'Creature' }))).toBe(true)
    expect(isCreature(makeFields({ type: 'Legendary Creature — Human Wizard' }))).toBe(true)
  })

  it('returns false for non-creatures', () => {
    expect(isCreature(makeFields({ type: 'Instant' }))).toBe(false)
    expect(isCreature(makeFields({ type: 'Sorcery' }))).toBe(false)
    expect(isCreature(makeFields({ type: 'Land' }))).toBe(false)
  })
})

describe('isLand', () => {
  it('returns true for lands', () => {
    expect(isLand(makeFields({ type: 'Land' }))).toBe(true)
    expect(isLand(makeFields({ type: 'Basic Land — Forest' }))).toBe(true)
  })

  it('returns false for non-lands', () => {
    expect(isLand(makeFields({ type: 'Creature' }))).toBe(false)
  })
})

describe('frameColor', () => {
  it('uses explicit override color when selected', () => {
    expect(frameColor(makeFields({ manaCost: '{G}{U}', color: 'blue' }))).toBe('blue')
  })

  it('returns land for land cards with no explicit color', () => {
    expect(frameColor(makeFields({ type: 'Basic Land', color: 'auto' }))).toBe('land')
  })

  it('defaults to colorless when there is no colored mana in the cost', () => {
    expect(frameColor(makeFields({ color: 'auto', type: 'Artifact' }))).toBe('colorless')
  })

  it('derives monocolor frames from mana cost', () => {
    expect(frameColor(makeFields({ manaCost: '{G}', color: 'auto' }))).toBe('green')
  })

  it('derives gold frames from multicolor mana cost', () => {
    expect(frameColor(makeFields({ manaCost: '{G}{U}' }))).toBe('gold')
  })
})

describe('manaFrameColors', () => {
  it('extracts canonical mana colors from costs', () => {
    expect(manaFrameColors(makeFields({ manaCost: '{G}{U}' }))).toEqual(['blue', 'green'])
    expect(manaFrameColors(makeFields({ manaCost: '{2/W}{G/U}{C}' }))).toEqual(['white', 'blue', 'green'])
  })
})

describe('multicolorFrameGradient', () => {
  it('builds gradient stops for multicolor costs', () => {
    expect(multicolorFrameGradient(makeFields({ manaCost: '{G}{U}' }))).toEqual([
      [0, '#b3c9e3'],
      [1, '#7db57d'],
    ])
  })
})

describe('typeLine', () => {
  it('builds simple type line', () => {
    expect(typeLine(makeFields({ type: 'Instant' }))).toBe('Instant')
  })

  it('includes supertype', () => {
    expect(typeLine(makeFields({ supertype: 'Legendary', type: 'Creature' }))).toBe(
      'Legendary Creature',
    )
  })

  it('includes subtype with em dash', () => {
    expect(typeLine(makeFields({ type: 'Creature', subtype: 'Human Wizard' }))).toBe(
      'Creature — Human Wizard',
    )
  })

  it('includes all three parts', () => {
    expect(
      typeLine(makeFields({ supertype: 'Legendary', type: 'Creature', subtype: 'Dragon' })),
    ).toBe('Legendary Creature — Dragon')
  })
})
