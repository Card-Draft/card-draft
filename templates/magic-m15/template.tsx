/**
 * Magic M15 frame template component.
 *
 * Canvas coordinate space: 744 × 1039 px (logical, @ 100ppi = 2.5" × 3.5")
 * All positions are in these logical pixels.
 *
 * Phase 1 frames are geometric SVG placeholders in the correct M15 proportions.
 * Community contributors can replace the SVG assets with pixel-perfect artwork.
 */

import { Group, Rect, Image as KonvaImage, Text } from 'react-konva'
import useImage from 'use-image'
import type { TemplateProps } from '@card-draft/template-runtime'
import {
  TextField,
  ArtBox,
  RulesBox,
  PtBox,
  ManaText,
} from '@card-draft/template-runtime'
import type { M15Fields } from './fields'
import {
  isCreature,
  isLand,
  frameColor,
  typeLine,
  FRAME_COLORS,
  RARITY_COLORS,
} from './logic'

// M15 card layout constants (in logical px)
const BORDER = 24
const CARD_W = 744
const CARD_H = 1039

// Art box
const ART_X = 57
const ART_Y = 104
const ART_W = 630
const ART_H = 462

// Name bar
const NAME_X = 57
const NAME_Y = 52
const NAME_W = 560

// Mana cost (right side of name bar)
const MANA_X = 620
const MANA_Y = 52

// Type line
const TYPE_X = 57
const TYPE_Y = 582
const TYPE_W = 578

// Rarity gem
const RARITY_X = 680
const RARITY_Y = 582

// Text box
const TEXTBOX_X = 57
const TEXTBOX_Y = 614
const TEXTBOX_W = 630
const TEXTBOX_H = 322

// P/T box
const PT_X = 635
const PT_Y = 960

// Footer
const FOOTER_Y = 1000
const FOOTER_X = 57

export default function M15Template({ fields: rawFields, assetsPath }: TemplateProps<M15Fields>) {
  const fields = rawFields
  const color = frameColor(fields)
  const frameHex = FRAME_COLORS[color]
  const rarityColor = RARITY_COLORS[fields.rarity] ?? RARITY_COLORS['common']!
  const creature = isCreature(fields)
  const land = isLand(fields)
  const typeLineText = typeLine(fields)
  const symbolsPath = `${assetsPath}/symbols`

  // Load frame SVG (falls back to colored rect if not found)
  const frameSrc = `${assetsPath}/frame-${color}.svg`
  const [frameImage] = useImage(frameSrc, 'anonymous')

  return (
    <Group listening={false}>
      {/* Card border */}
      <Rect
        x={0}
        y={0}
        width={CARD_W}
        height={CARD_H}
        fill="#1a1205"
        cornerRadius={18}
      />

      {/* Card background */}
      <Rect
        x={BORDER}
        y={BORDER}
        width={CARD_W - BORDER * 2}
        height={CARD_H - BORDER * 2}
        fill={frameHex}
        cornerRadius={10}
      />

      {/* Name bar */}
      <Rect x={NAME_X} y={NAME_Y - 8} width={NAME_W + 100} height={34} fill={frameHex} cornerRadius={4} />

      {/* Card name */}
      <TextField
        x={NAME_X + 4}
        y={NAME_Y - 4}
        width={NAME_W}
        text={fields.name || 'New Card'}
        fontSize={20}
        fontStyle="bold"
        fill={color === 'black' ? '#e5e7eb' : '#1a1a1a'}
      />

      {/* Mana cost (right of name bar) */}
      {!land && fields.manaCost && (
        <ManaText
          x={MANA_X}
          y={NAME_Y - 4}
          width={100}
          text={fields.manaCost}
          fontSize={16}
          symbolBasePath={symbolsPath}
        />
      )}

      {/* Art box */}
      <ArtBox
        x={ART_X}
        y={ART_Y}
        width={ART_W}
        height={ART_H}
        src={fields.art ?? null}
      />

      {/* Frame overlay (SVG art frame, drawn on top of art) */}
      {frameImage && (
        <KonvaImage
          x={BORDER}
          y={BORDER}
          width={CARD_W - BORDER * 2}
          height={CARD_H - BORDER * 2}
          image={frameImage}
          listening={false}
        />
      )}

      {/* Type line bar */}
      <Rect x={TYPE_X} y={TYPE_Y - 4} width={TYPE_W} height={28} fill={frameHex} cornerRadius={4} />
      <TextField
        x={TYPE_X + 4}
        y={TYPE_Y}
        width={TYPE_W - 8}
        text={typeLineText}
        fontSize={14}
        fontStyle="bold"
        fill={color === 'black' ? '#e5e7eb' : '#1a1a1a'}
      />

      {/* Rarity gem */}
      <Rect x={RARITY_X} y={RARITY_Y - 4} width={20} height={20} fill={rarityColor} cornerRadius={10} />

      {/* Rules + flavor text box */}
      <RulesBox
        x={TEXTBOX_X}
        y={TEXTBOX_Y}
        width={TEXTBOX_W}
        height={TEXTBOX_H}
        rulesText={fields.rulesText}
        flavorText={fields.flavorText}
        symbolBasePath={symbolsPath}
        fontSize={14}
        background={color === 'black' ? 'rgba(30,30,30,0.9)' : 'rgba(240,237,224,0.9)'}
      />

      {/* Power / Toughness */}
      {creature && (fields.power || fields.toughness) && (
        <PtBox
          x={PT_X}
          y={PT_Y}
          power={fields.power}
          toughness={fields.toughness}
          background={frameHex}
          textColor={color === 'black' ? '#e5e7eb' : '#1a1a1a'}
        />
      )}

      {/* Footer: artist + collector number */}
      <Text
        x={FOOTER_X}
        y={FOOTER_Y}
        width={400}
        text={fields.artist ? `Illus. ${fields.artist}` : ''}
        fontSize={9}
        fontFamily="Geist Sans"
        fill={color === 'black' ? '#9ca3af' : '#4b5563'}
        listening={false}
      />
      <Text
        x={CARD_W - BORDER - 60}
        y={FOOTER_Y}
        width={60}
        text={fields.collectorNumber ? `${fields.collectorNumber}` : ''}
        fontSize={9}
        fontFamily="Geist Sans"
        align="right"
        fill={color === 'black' ? '#9ca3af' : '#4b5563'}
        listening={false}
      />
    </Group>
  )
}
