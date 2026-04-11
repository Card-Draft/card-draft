/**
 * Magic M15 frame template component.
 *
 * Canvas coordinate space: 744 × 1039 px (logical, @ ~96ppi = 2.5" × 3.5")
 *
 * Layout is driven by the frame SVG assets (frame-{color}.svg).
 * The frame SVG is rendered first as the base layer, then art is composited
 * into the art window, then text elements are drawn on top.
 *
 * Frame SVG regions (px):
 *   Name bar:  x=30  y=30   w=684 h=64
 *   Art:       x=35  y=109  w=674 h=458  (inner; outer border x=30 y=104)
 *   Type bar:  x=30  y=580  w=684 h=44
 *   Text box:  x=30  y=632  w=684 h=330
 *   P/T box:   x=618 y=940  w=96  h=46
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import useImage from 'use-image'
import type { TemplateProps } from '@card-draft/template-runtime'
import {
  TextField,
  ArtBox,
  RulesBox,
  PtBox,
  ManaText,
  RarityIcon,
} from '@card-draft/template-runtime'
import type { M15Fields } from './fields'
import {
  isCreature,
  isLand,
    frameColor,
    multicolorFrameGradient,
    typeLine,
  RARITY_COLORS,
  RARITY_GRADIENTS,
  DARK_FRAMES,
} from './logic'

const CARD_W = 744
const CARD_H = 1039

// These match the SVG frame regions exactly
const NAME_BAR = { x: 30, y: 30, w: 684, h: 64 }
const ART = { x: 35, y: 109, w: 674, h: 458 }
const TYPE_BAR = { x: 30, y: 580, w: 684, h: 44 }
const TEXT_BOX = { x: 30, y: 632, w: 684, h: 330 }
const PT_BOX = { x: 618, y: 940, w: 96, h: 46 }

// Rarity icon dimensions — sits at right end of type bar
const RARITY_ICON_SIZE = 36
const RARITY_ICON_X = TYPE_BAR.x + TYPE_BAR.w - RARITY_ICON_SIZE - 6
const RARITY_ICON_Y = TYPE_BAR.y + (TYPE_BAR.h - RARITY_ICON_SIZE) / 2

const BAR_PAD = 14
const NAME_BAR_RADIUS = 12
const TYPE_BAR_RADIUS = 10
const TEXT_BOX_RADIUS = 10
const PT_BOX_RADIUS = 10
const NAME_FONT = 'CardDraft Matrix Bold'
const TYPE_FONT = 'CardDraft ModMatrix'
const BODY_FONT = 'CardDraft Plantin'
const BODY_ITALIC_FONT = 'CardDraft Plantin Italic'

const TEMPLATE_FONTS = [
  { family: NAME_FONT, file: 'MatrixBold.ttf' },
  { family: TYPE_FONT, file: 'ModMatrix.ttf' },
  { family: BODY_FONT, file: 'mplantin.ttf' },
  { family: BODY_ITALIC_FONT, file: 'mplantinit.ttf' },
] as const

function normalizeTypeLineDisplayText(text: string) {
  return text.replace(/--/g, '—')
}

interface AssetStatus {
  pending: boolean
  error: string | null
}

interface M15TemplateProps extends TemplateProps<M15Fields> {
  onAssetStatusChange?: (status: AssetStatus) => void
}

function parseFraction(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const loadedFontFamilies = new Set<string>()

function encodeFontUrl(url: string) {
  return url.replace(/"/g, '%22').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20')
}

function useTemplateFonts(assetsPath: string) {
  const [loaded, setLoaded] = useState(false)

  const fontDefinitions = useMemo(
    () => TEMPLATE_FONTS.map((font) => ({ ...font, src: `${assetsPath}/fonts/${font.file}` })),
    [assetsPath],
  )

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (typeof FontFace === 'undefined' || typeof document === 'undefined') {
        setLoaded(true)
        return
      }

      try {
        await Promise.all(
          fontDefinitions.map(async (font) => {
            if (loadedFontFamilies.has(font.family)) return
            const face = new FontFace(font.family, `url("${encodeFontUrl(font.src)}")`)
            await face.load()
            document.fonts.add(face)
            loadedFontFamilies.add(font.family)
          }),
        )
        await document.fonts.load('16px "Mana"')
      } catch {
        // Fall back to system fonts if bundled fonts fail to load.
      }

      if (!cancelled) {
        setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fontDefinitions])

  return loaded
}

export default function M15Template({
  fields,
  assetsPath,
  setMetadata,
  onAssetStatusChange,
}: M15TemplateProps) {
  const fontsLoaded = useTemplateFonts(assetsPath)
  const color = frameColor(fields)
  const frameGradient = multicolorFrameGradient(fields)
  const creature = isCreature(fields)
  const land = isLand(fields)
  const typeLineText = normalizeTypeLineDisplayText(typeLine(fields))
  const symbolsPath = `${assetsPath}/symbols`

  const cropWidth = clamp(parseFraction(fields.artCropWidth, 1), 0.05, 1)
  const cropHeight = clamp(parseFraction(fields.artCropHeight, 1), 0.05, 1)
  const cropX = clamp(parseFraction(fields.artCropX, 0), 0, 1 - cropWidth)
  const cropY = clamp(parseFraction(fields.artCropY, 0), 0, 1 - cropHeight)

  const isDark = DARK_FRAMES.has(color)
  const textFill = isDark ? '#e5e7eb' : '#1a1a1a'
  const subtleFill = isDark ? '#9ca3af' : '#4b5563'

  // Rarity icon gradient / solid color
  const rarityGradient = RARITY_GRADIENTS[fields.rarity] ?? []
  const isCommon = fields.rarity === 'common'
  const commonFill = '#000000'
  const commonStroke = '#ffffff'
  const rarityIconSrc = setMetadata?.rarityIcon ?? fields.rarityIcon
  // Fallback dot color (when no SVG uploaded)
  const rarityDotColor = RARITY_COLORS[fields.rarity] ?? '#b0b0b0'

  // Frame SVG — rendered as the base of the card
  const frameSrc = `${assetsPath}/frame-${color}.svg`
  const [frameImage, frameStatus] = useImage(frameSrc, 'anonymous')

  useEffect(() => {
    if (!onAssetStatusChange) return
    onAssetStatusChange({
      pending: !fontsLoaded || frameStatus === 'loading' || Boolean(fields.art),
      error: frameStatus === 'failed' ? `Failed to load frame: ${frameSrc}` : null,
    })
  }, [fields.art, fontsLoaded, frameSrc, frameStatus, onAssetStatusChange])

  const handleImageStatusChange = useCallback(
    (status: { src: string | null; loaded: boolean; error: string | null }) => {
      onAssetStatusChange?.({
        pending:
          !fontsLoaded ||
          frameStatus === 'loading' ||
          (Boolean(status.src) && !status.loaded && !status.error),
        error: status.error ?? (frameStatus === 'failed' ? `Failed to load frame: ${frameSrc}` : null),
      })
      window.dispatchEvent(new CustomEvent('card-draft:image-status', { detail: status }))
    },
    [fontsLoaded, frameSrc, frameStatus, onAssetStatusChange],
  )

  // Mana cost layout
  const manaSymbolCount = (fields.manaCost?.match(/\{[^}]+\}/g) ?? []).length
  const manaSymbolSize = 30
  const manaWidth = Math.max(manaSymbolCount * (manaSymbolSize + 2), manaSymbolSize)
  const nameTextWidth = NAME_BAR.w - BAR_PAD * 2 - manaWidth - 8
  const manaX = NAME_BAR.x + NAME_BAR.w - BAR_PAD - manaWidth
  const nameTextY = NAME_BAR.y + (NAME_BAR.h - 30) / 2
  const typeTextY = TYPE_BAR.y + (TYPE_BAR.h - 24) / 2

  // Type line width leaves room for rarity icon
  const typeTextWidth = TYPE_BAR.w - BAR_PAD * 2 - RARITY_ICON_SIZE - 12

  const multicolorOutline =
    color === 'gold' && frameGradient
      ? frameGradient.flatMap(([offset, hex]) => [offset, hex])
      : null

  return (
    <Group listening={false}>
      {/* 1. Frame SVG — card background, all bars, borders */}
      {frameImage ? (
        <KonvaImage
          x={0}
          y={0}
          width={CARD_W}
          height={CARD_H}
          image={frameImage}
          listening={false}
        />
      ) : (
        <Text x={20} y={20} text="Loading frame…" fontSize={14} fill="#888" listening={false} />
      )}

      {multicolorOutline ? (
        <>
          <Rect
            x={NAME_BAR.x}
            y={NAME_BAR.y}
            width={NAME_BAR.w}
            height={NAME_BAR.h}
            cornerRadius={NAME_BAR_RADIUS}
            strokeWidth={3}
            strokeLinearGradientStartPoint={{ x: NAME_BAR.x, y: NAME_BAR.y }}
            strokeLinearGradientEndPoint={{ x: NAME_BAR.x + NAME_BAR.w, y: NAME_BAR.y + NAME_BAR.h }}
            strokeLinearGradientColorStops={multicolorOutline}
            listening={false}
          />
          <Rect
            x={TYPE_BAR.x}
            y={TYPE_BAR.y}
            width={TYPE_BAR.w}
            height={TYPE_BAR.h}
            cornerRadius={TYPE_BAR_RADIUS}
            strokeWidth={3}
            strokeLinearGradientStartPoint={{ x: TYPE_BAR.x, y: TYPE_BAR.y }}
            strokeLinearGradientEndPoint={{ x: TYPE_BAR.x + TYPE_BAR.w, y: TYPE_BAR.y + TYPE_BAR.h }}
            strokeLinearGradientColorStops={multicolorOutline}
            listening={false}
          />
          <Rect
            x={TEXT_BOX.x}
            y={TEXT_BOX.y}
            width={TEXT_BOX.w}
            height={TEXT_BOX.h}
            cornerRadius={TEXT_BOX_RADIUS}
            strokeWidth={3}
            strokeLinearGradientStartPoint={{ x: TEXT_BOX.x, y: TEXT_BOX.y }}
            strokeLinearGradientEndPoint={{ x: TEXT_BOX.x + TEXT_BOX.w, y: TEXT_BOX.y + TEXT_BOX.h }}
            strokeLinearGradientColorStops={multicolorOutline}
            listening={false}
          />
          {creature && (fields.power || fields.toughness) ? (
            <Rect
              x={PT_BOX.x}
              y={PT_BOX.y}
              width={PT_BOX.w}
              height={PT_BOX.h}
              cornerRadius={PT_BOX_RADIUS}
              strokeWidth={3}
              strokeLinearGradientStartPoint={{ x: PT_BOX.x, y: PT_BOX.y }}
              strokeLinearGradientEndPoint={{ x: PT_BOX.x + PT_BOX.w, y: PT_BOX.y + PT_BOX.h }}
              strokeLinearGradientColorStops={multicolorOutline}
              listening={false}
            />
          ) : null}
        </>
      ) : null}

      {/* 2. Art */}
      <ArtBox
        x={ART.x}
        y={ART.y}
        width={ART.w}
        height={ART.h}
        src={fields.art ?? null}
        cropX={cropX}
        cropY={cropY}
        cropWidth={cropWidth}
        cropHeight={cropHeight}
        onImageStatusChange={handleImageStatusChange}
      />

      {/* 3. Card name */}
      <TextField
        x={NAME_BAR.x + BAR_PAD}
        y={nameTextY}
        width={nameTextWidth}
        text={fields.name || 'New Card'}
        fontSize={30}
        fontFamily={NAME_FONT}
        fontStyle="normal"
        fill={textFill}
      />

      {/* 4. Mana cost */}
      {!land && fields.manaCost && (
        <ManaText
          x={manaX}
          y={NAME_BAR.y + (NAME_BAR.h - manaSymbolSize) / 2}
          width={manaWidth}
          text={fields.manaCost}
          fontSize={manaSymbolSize}
          symbolSize={manaSymbolSize}
          symbolBasePath={symbolsPath}
        />
      )}

      {/* 5. Type line */}
      <TextField
        x={TYPE_BAR.x + BAR_PAD}
        y={typeTextY}
        width={typeTextWidth}
        text={typeLineText}
        fontSize={22}
        fontFamily={TYPE_FONT}
        fontStyle="normal"
        fill={textFill} 
      />

      {/* 6. Rarity icon */}
      {rarityIconSrc ? (
        <RarityIcon
          src={rarityIconSrc}
          x={RARITY_ICON_X}
          y={RARITY_ICON_Y}
          size={RARITY_ICON_SIZE}
          gradientStops={rarityGradient}
          solidColor={isCommon ? commonFill : rarityDotColor}
          strokeColor={isCommon ? commonStroke : '#ffffff'}
          strokeWidth={2}
        />
      ) : (
        /* Fallback dot when no SVG uploaded */
        <Text
          x={RARITY_ICON_X}
          y={TYPE_BAR.y + (TYPE_BAR.h - 26) / 2}
          width={RARITY_ICON_SIZE}
          height={26}
          text="◆"
          fontSize={22}
          fill={isCommon ? commonFill : rarityDotColor}
          align="center"
          listening={false}
        />
      )}

      {/* 7. Rules + flavor text */}
      <RulesBox
        x={TEXT_BOX.x}
        y={TEXT_BOX.y}
        width={TEXT_BOX.w}
        height={TEXT_BOX.h}
        rulesText={fields.rulesText}
        flavorText={fields.flavorText}
        cardName={fields.name || 'New Card'}
        symbolBasePath={symbolsPath}
        fontSize={28}
        fontFamily={BODY_FONT}
        italicFontFamily={BODY_ITALIC_FONT}
        background="transparent"
        stroke="transparent"
        strokeWidth={0}
      />

      {/* 8. Power / Toughness */}
      {creature && (fields.power || fields.toughness) && (
        <PtBox
          x={PT_BOX.x}
          y={PT_BOX.y}
          power={fields.power}
          toughness={fields.toughness}
          background="transparent"
          textColor={textFill}
          stroke="transparent"
        />
      )}

      {/* 9. Footer */}
      <Text
        x={NAME_BAR.x}
        y={CARD_H - 26}
        width={320}
        text={fields.artist ? `Illus. ${fields.artist}` : ''}
        fontSize={10}
        fontFamily={BODY_FONT}
        fill={subtleFill}
        listening={false}
      />
      <Text
        x={CARD_W - NAME_BAR.x - 80}
        y={CARD_H - 26}
        width={80}
        text={fields.collectorNumber ?? ''}
        fontSize={10}
        fontFamily={BODY_FONT}
        align="right"
        fill={subtleFill}
        listening={false}
      />
    </Group>
  )
}
