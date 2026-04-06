/**
 * .mse-set importer
 *
 * .mse-set files are ZIP archives containing a plain-text file called "set"
 * that uses a hierarchical key-value format. We parse the card entries and
 * map them to the Card Draft schema using the magic-m15 field names.
 */

import JSZip from 'jszip'

export interface MseCard {
  name: string
  manaCost: string
  color: string
  supertype: string
  type: string
  subtype: string
  rulesText: string
  flavorText: string
  power: string
  toughness: string
  rarity: string
  artist: string
  notes: string
}

export interface MseSet {
  name: string
  game: string
  cards: MseCard[]
}

/**
 * Parse a .mse-set file buffer into a structured MseSet object.
 */
export async function parseMseSet(buffer: ArrayBuffer): Promise<MseSet> {
  const zip = await JSZip.loadAsync(buffer)

  const setFile = zip.file('set')
  if (!setFile) throw new Error('Invalid .mse-set file: missing "set" entry')

  const raw = await setFile.async('text')
  return parseMseText(raw)
}

function parseMseText(text: string): MseSet {
  const lines = text.split('\n')
  const setData: MseSet = { name: 'Imported Set', game: 'magic', cards: [] }

  let i = 0
  let inCard = false
  let currentCard: Partial<MseCard> = {}
  let depth = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    if (trimmed === 'card:') {
      // Start of a card block
      if (inCard && Object.keys(currentCard).length > 0) {
        setData.cards.push(normalizeCard(currentCard))
      }
      inCard = true
      currentCard = {}
      depth = 1
    } else if (inCard && trimmed === '' && depth > 0) {
      // Empty line may end a block — track by indentation
      depth = 0
    } else if (!inCard) {
      // Top-level set properties
      const match = /^(\w[\w. ]*?):\s*(.*)$/.exec(trimmed)
      if (match) {
        const [, key, value] = match
        if (key === 'title' || key === 'name') setData.name = value ?? ''
        if (key === 'game') setData.game = value ?? 'magic'
      }
    } else if (inCard) {
      // Card property
      const match = /^(\w[\w. ]*?):\s*(.*)$/.exec(trimmed)
      if (match) {
        const [, key, value] = match
        mapMseField(currentCard, key ?? '', value ?? '')
      }
    }

    i++
  }

  // Push the last card
  if (inCard && Object.keys(currentCard).length > 0) {
    setData.cards.push(normalizeCard(currentCard))
  }

  return setData
}

function mapMseField(card: Partial<MseCard>, key: string, value: string) {
  // MSE uses various key names across different template versions
  switch (key.toLowerCase().replace(/[.\s]/g, '_')) {
    case 'name':
      card.name = value
      break
    case 'casting_cost':
    case 'mana_cost':
      card.manaCost = value
      break
    case 'color':
    case 'card_color':
      card.color = value
      break
    case 'super_type':
    case 'supertype':
      card.supertype = value
      break
    case 'type':
    case 'card_type':
      card.type = value
      break
    case 'sub_type':
    case 'subtype':
      card.subtype = value
      break
    case 'rule_text':
    case 'rules_text':
    case 'oracle_text':
      card.rulesText = value
      break
    case 'flavor_text':
    case 'flavor':
      card.flavorText = value
      break
    case 'power':
    case 'pt':
      if (value.includes('/')) {
        const [p, t] = value.split('/')
        card.power = (p ?? '').trim()
        card.toughness = (t ?? '').trim()
      } else {
        card.power = value
      }
      break
    case 'toughness':
      card.toughness = value
      break
    case 'rarity':
      card.rarity = value
      break
    case 'artist':
    case 'illustrator':
      card.artist = value
      break
    case 'notes':
    case 'comment':
      card.notes = value
      break
  }
}

function normalizeCard(partial: Partial<MseCard>): MseCard {
  return {
    name: partial.name ?? '',
    manaCost: partial.manaCost ?? '',
    color: partial.color ?? 'colorless',
    supertype: partial.supertype ?? '',
    type: partial.type ?? 'Instant',
    subtype: partial.subtype ?? '',
    rulesText: partial.rulesText ?? '',
    flavorText: partial.flavorText ?? '',
    power: partial.power ?? '',
    toughness: partial.toughness ?? '',
    rarity: partial.rarity ?? 'common',
    artist: partial.artist ?? '',
    notes: partial.notes ?? '',
  }
}

/**
 * Convert an MseCard to the magic-m15 fields JSON blob.
 */
export function mseCardToM15Fields(card: MseCard): Record<string, string> {
  return {
    name: card.name,
    manaCost: card.manaCost,
    color: card.color,
    supertype: card.supertype,
    type: card.type,
    subtype: card.subtype,
    rulesText: card.rulesText,
    flavorText: card.flavorText,
    power: card.power,
    toughness: card.toughness,
    rarity: card.rarity,
    artist: card.artist,
  }
}
