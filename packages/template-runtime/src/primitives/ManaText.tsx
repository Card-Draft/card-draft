/**
 * ManaText — renders a string containing mana symbol codes like {W}, {2}, {T}
 * as a horizontal run of text + inline font symbols on the Konva canvas,
 * with image assets retained as fallback.
 */

import { Group, Text, Image as KonvaImage, Circle } from 'react-konva'
import useImage from 'use-image'
import { tokenizeManaText } from './manaTokenize'
import {
  buildManaSymbolAssetPath,
  getManaCostBackground,
  isManaCostSymbol,
  resolveManaFontGlyphs,
} from './manaFont'

// Symbol color map for colored circles (fallback when image not loaded)
const SYMBOL_COLORS: Record<string, string> = {
  W: '#f9fafb',
  U: '#3b82f6',
  B: '#1f2937',
  R: '#ef4444',
  G: '#22c55e',
  C: '#9ca3af',
  T: '#d97706',
  X: '#6b7280',
  '0': '#6b7280',
}
for (let i = 1; i <= 20; i++) SYMBOL_COLORS[String(i)] = '#6b7280'

interface ManaSymbolProps {
  symbol: string
  x: number
  y: number
  size: number
  symbolBasePath: string
  fill: string
}

function ManaFontSymbol({
  symbol,
  x,
  y,
  size,
  fill,
  glyphs,
}: Omit<ManaSymbolProps, 'symbolBasePath'> & { glyphs: NonNullable<ReturnType<typeof resolveManaFontGlyphs>> }) {
  const background = getManaCostBackground(symbol)
  const primaryGlyph = glyphs.before ?? glyphs.after
  const secondaryGlyph = glyphs.after
  const symbolFill = isManaCostSymbol(symbol) ? '#111111' : fill

  if (!primaryGlyph) return null

  if (!isManaCostSymbol(symbol)) {
    return (
      <Text
        x={x}
        y={y + size * 0.04}
        width={size}
        height={size}
        text={primaryGlyph}
        fontSize={size * 0.92}
        fontFamily="Mana"
        fill={symbolFill}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    )
  }

  const backgroundNode =
    background.kind === 'split' ? (
      (() => {
        const [topColor, bottomColor] = background.colors as [string, string]

        return (
          <Circle
            x={size / 2}
            y={size / 2}
            radius={size / 2}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: size, y: size }}
            fillLinearGradientColorStops={[
              0,
              topColor,
              0.499,
              topColor,
              0.501,
              bottomColor,
              1,
              bottomColor,
            ]}
            stroke="rgba(17, 17, 17, 0.15)"
            strokeWidth={Math.max(0.75, size * 0.03)}
            listening={false}
          />
        )
      })()
    ) : (
      <Circle
        x={size / 2}
        y={size / 2}
        radius={size / 2}
        fill={background.colors[0]}
        stroke="rgba(17, 17, 17, 0.15)"
        strokeWidth={Math.max(0.75, size * 0.03)}
        listening={false}
      />
    )

  return (
    <Group x={x} y={y} listening={false}>
      {backgroundNode}
      {secondaryGlyph ? (
        <>
          <Text
            x={size * 0.08}
            y={size * -0.02}
            width={size * 0.42}
            height={size * 0.42}
            text={primaryGlyph}
            fontSize={size * 0.42}
            fontFamily="Mana"
            fill={symbolFill}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
          <Text
            x={size * 0.5}
            y={size * 0.45}
            width={size * 0.42}
            height={size * 0.42}
            text={secondaryGlyph}
            fontSize={size * 0.42}
            fontFamily="Mana"
            fill={symbolFill}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      ) : (
        <Text
          x={0}
          y={size * 0.08}
          width={size}
          height={size}
          text={primaryGlyph}
          fontSize={size * 0.74}
          fontFamily="Mana"
          fill={symbolFill}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
    </Group>
  )
}

function ManaSymbol({ symbol, x, y, size, symbolBasePath, fill }: ManaSymbolProps) {
  const glyphs = resolveManaFontGlyphs(symbol)
  const src = glyphs ? '' : buildManaSymbolAssetPath(symbolBasePath, symbol)
  const [image] = useImage(src, 'anonymous')

  if (glyphs) {
    return <ManaFontSymbol symbol={symbol} x={x} y={y} size={size} fill={fill} glyphs={glyphs} />
  }

  if (image) {
    return (
      <KonvaImage
        x={x}
        y={y}
        width={size}
        height={size}
        image={image}
        listening={false}
      />
    )
  }

  // Fallback: colored circle with letter
  const color = SYMBOL_COLORS[symbol] ?? '#6b7280'
  return (
    <Group x={x} y={y} listening={false}>
      <Circle x={size / 2} y={size / 2} radius={size / 2} fill={color} />
      <Text
        x={0}
        y={size * 0.15}
        width={size}
        text={symbol.length === 1 ? symbol : symbol.slice(0, 2)}
        fontSize={size * 0.55}
        fontFamily="Geist Sans"
        fontStyle="bold"
        fill={symbol === 'W' ? '#374151' : '#ffffff'}
        align="center"
      />
    </Group>
  )
}

interface ManaTextProps {
  x: number
  y: number
  width: number
  text: string
  fontSize?: number
  symbolSize?: number
  /** Base URL/path for symbol SVGs e.g. file:///...templates/magic-m15/assets/symbols */
  symbolBasePath: string
  fill?: string
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
}

export function ManaText({
  x,
  y,
  width,
  text,
  fontSize = 14,
  symbolSize,
  symbolBasePath,
  fill = '#1a1a1a',
  fontFamily = 'Geist Sans',
  fontStyle = 'normal',
}: ManaTextProps) {
  const symSize = symbolSize ?? fontSize * 1.1
  const tokens = tokenizeManaText(text)

  // Lay out tokens left-to-right, wrapping at width
  // This is a simplified single-line layout; multi-line wrapping is TODO
  const elements: React.ReactNode[] = []
  let cursorX = 0
  let cursorY = 0
  const lineHeight = fontSize * 1.4

  tokens.forEach((token, i) => {
    if (token.kind === 'text') {
      // Rough char width estimate for layout (not pixel-perfect)
      elements.push(
        <Text
          key={i}
          x={cursorX}
          y={cursorY + (symSize - fontSize) / 2}
          text={token.value}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          fill={fill}
          listening={false}
        />,
      )
      cursorX += token.value.length * fontSize * 0.55
    } else {
      // Wrap if needed
      if (cursorX + symSize > width) {
        cursorX = 0
        cursorY += lineHeight
      }
      elements.push(
        <ManaSymbol
          key={i}
          symbol={token.value}
          x={cursorX}
          y={cursorY}
          size={symSize}
          symbolBasePath={symbolBasePath}
          fill={fill}
        />,
      )
      cursorX += symSize + 1
    }
  })

  return <Group x={x} y={y}>{elements}</Group>
}
