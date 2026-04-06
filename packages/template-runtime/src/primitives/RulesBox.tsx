import { Group, Rect } from 'react-konva'
import { ManaText } from './ManaText'

interface RulesBoxProps {
  x: number
  y: number
  width: number
  height: number
  rulesText: string
  flavorText?: string
  fontSize?: number
  symbolBasePath: string
  background?: string
}

export function RulesBox({
  x,
  y,
  width,
  height,
  rulesText,
  flavorText,
  fontSize = 14,
  symbolBasePath,
  background = 'rgba(255,255,255,0.85)',
}: RulesBoxProps) {
  const padding = 8
  const innerWidth = width - padding * 2

  return (
    <Group x={x} y={y}>
      {/* Text box background */}
      <Rect width={width} height={height} fill={background} cornerRadius={2} listening={false} />

      {/* Rules text (with inline mana symbols) */}
      <ManaText
        x={padding}
        y={padding}
        width={innerWidth}
        text={rulesText}
        fontSize={fontSize}
        symbolBasePath={symbolBasePath}
        fill="#111111"
      />

      {/* Flavor text (italic, below a divider if both exist) */}
      {flavorText && (
        <ManaText
          x={padding}
          y={padding + fontSize * 1.4 * Math.max(1, countLines(rulesText, innerWidth, fontSize)) + 8}
          width={innerWidth}
          text={flavorText}
          fontSize={fontSize - 1}
          symbolBasePath={symbolBasePath}
          fill="#333333"
          fontStyle="italic"
        />
      )}
    </Group>
  )
}

/** Very rough line count estimate for layout purposes */
function countLines(text: string, width: number, fontSize: number): number {
  const charsPerLine = Math.floor(width / (fontSize * 0.55))
  return Math.ceil(text.length / charsPerLine) || 1
}
