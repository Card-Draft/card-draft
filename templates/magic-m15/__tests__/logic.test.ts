import { describe, it, expect } from 'vitest'
import { isCreature, isLand, frameColor, typeLine } from '../logic'
import type { M15Fields } from '../fields'

function makeFields(overrides: Partial<M15Fields> = {}): M15Fields {
  return {
    name: 'Test Card',
    manaCost: '',
    color: 'colorless',
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
  it('uses explicit color when set', () => {
    expect(frameColor(makeFields({ color: 'blue' }))).toBe('blue')
  })

  it('returns land for land cards with no explicit color', () => {
    expect(frameColor(makeFields({ type: 'Basic Land', color: 'colorless' }))).toBe('land')
  })

  it('defaults to colorless', () => {
    expect(frameColor(makeFields({ color: 'colorless', type: 'Artifact' }))).toBe('colorless')
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
