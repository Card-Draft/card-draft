/**
 * ManaText — renders a string containing mana symbol codes like {W}, {2}, {T}
 * as a horizontal run of text + inline SVG symbol images on the Konva canvas.
 *
 * Example input: "Pay {2}{W}" renders: "Pay " + [2 symbol] + [W symbol]
 */

import { Group, Text, Image as KonvaImage, Circle } from 'react-konva'
import useImage from 'use-image'

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
}

function ManaSymbol({ symbol, x, y, size, symbolBasePath }: ManaSymbolProps) {
  const src = `${symbolBasePath}/${symbol.toLowerCase()}.svg`
  const [image] = useImage(src, 'anonymous')

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

interface TextToken { kind: 'text'; value: string }
interface SymbolToken { kind: 'symbol'; value: string }
type Token = TextToken | SymbolToken

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let remaining = input
  while (remaining.length > 0) {
    const match = /^\{([^}]+)\}/.exec(remaining)
    if (match) {
      tokens.push({ kind: 'symbol', value: match[1] ?? '' })
      remaining = remaining.slice(match[0].length)
    } else {
      const end = remaining.indexOf('{')
      const text = end === -1 ? remaining : remaining.slice(0, end)
      tokens.push({ kind: 'text', value: text })
      remaining = end === -1 ? '' : remaining.slice(end)
    }
  }
  return tokens
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
  const tokens = tokenize(text)

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
        />,
      )
      cursorX += symSize + 1
    }
  })

  return <Group x={x} y={y}>{elements}</Group>
}
