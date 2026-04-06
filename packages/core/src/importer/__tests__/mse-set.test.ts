import { describe, it, expect } from 'vitest'
import { mseCardToM15Fields } from '../mse-set'
import type { MseCard } from '../mse-set'

const sampleCard: MseCard = {
  name: 'Lightning Bolt',
  manaCost: '{R}',
  color: 'red',
  supertype: '',
  type: 'Instant',
  subtype: '',
  rulesText: 'Lightning Bolt deals 3 damage to any target.',
  flavorText: 'The sparkmage shrieked, calling on the rage of the storms.',
  power: '',
  toughness: '',
  rarity: 'common',
  artist: 'Christopher Moeller',
  notes: '',
}

describe('mseCardToM15Fields', () => {
  it('maps name correctly', () => {
    expect(mseCardToM15Fields(sampleCard).name).toBe('Lightning Bolt')
  })

  it('maps manaCost correctly', () => {
    expect(mseCardToM15Fields(sampleCard).manaCost).toBe('{R}')
  })

  it('maps rulesText correctly', () => {
    expect(mseCardToM15Fields(sampleCard).rulesText).toBe(
      'Lightning Bolt deals 3 damage to any target.',
    )
  })

  it('maps color correctly', () => {
    expect(mseCardToM15Fields(sampleCard).color).toBe('red')
  })
})
