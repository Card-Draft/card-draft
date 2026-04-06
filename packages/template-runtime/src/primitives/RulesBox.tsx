import { Group, Rect } from 'react-konva'
import { ManaText } from './ManaText'
import { tokenizeManaText } from './manaTokenize'

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
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
}

interface StyledToken {
  kind: 'text' | 'symbol' | 'break'
  value: string
  fontSize: number
  fontFamily: string
  fill: string
  fontStyle: 'normal' | 'italic'
}

interface LineSegment {
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  fontStyle: 'normal' | 'italic'
  width: number
}

interface LineLayout {
  segments: LineSegment[]
  height: number
}

const TEXT_FILL = '#111111'
const REMINDER_FILL = '#4b5563'
const FLAVOR_FILL = '#333333'
const MIN_FONT_SIZE = 11
const RULES_FONT_FAMILY = 'Georgia'

export function RulesBox({
  x,
  y,
  width,
  height,
  rulesText,
  flavorText,
  fontSize = 15,
  symbolBasePath,
  background = 'rgba(255,255,255,0.85)',
  stroke = 'rgba(0,0,0,0.45)',
  strokeWidth = 2,
  cornerRadius = 6,
}: RulesBoxProps) {
  const padding = 10
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const layout = fitRulesLayout({
    rulesText,
    flavorText,
    width: innerWidth,
    height: innerHeight,
    fontSize,
  })
  const rulesHeight = layout.rulesLines.reduce((sum, line) => sum + line.height, 0)
  const dividerVisible = layout.hasFlavor && layout.rulesLines.length > 0
  const flavorStartY = padding + rulesHeight + (dividerVisible ? 8 : 0)

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={height}
        fill={background}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={cornerRadius}
        listening={false}
      />

      {layout.rulesLines.map((line, index) =>
        renderLine({
          key: `rules-${index}`,
          line,
          x: padding,
          y: padding + layout.rulesLines.slice(0, index).reduce((sum, entry) => sum + entry.height, 0),
          symbolBasePath,
        }),
      )}

      {dividerVisible ? (
        <Rect
          x={padding}
          y={padding + rulesHeight + 2}
          width={innerWidth}
          height={1}
          fill="rgba(0,0,0,0.22)"
          listening={false}
        />
      ) : null}

      {layout.flavorLines.map((line, index) =>
        renderLine({
          key: `flavor-${index}`,
          line,
          x: padding,
          y: flavorStartY + layout.flavorLines.slice(0, index).reduce((sum, entry) => sum + entry.height, 0),
          symbolBasePath,
        }),
      )}
    </Group>
  )
}

function renderLine({
  key,
  line,
  x,
  y,
  symbolBasePath,
}: {
  key: string
  line: LineLayout
  x: number
  y: number
  symbolBasePath: string
}) {
  let cursorX = x

  return (
    <Group key={key}>
      {line.segments.map((segment, index) => {
        const segmentX = cursorX
        cursorX += segment.width

        return (
          <ManaText
            key={`${key}-${index}`}
            x={segmentX}
            y={y}
            width={segment.width + segment.fontSize}
            text={segment.text}
            fontSize={segment.fontSize}
            fontFamily={segment.fontFamily}
            symbolBasePath={symbolBasePath}
            fill={segment.fill}
            fontStyle={segment.fontStyle}
          />
        )
      })}
    </Group>
  )
}

function fitRulesLayout({
  rulesText,
  flavorText,
  width,
  height,
  fontSize,
}: {
  rulesText: string
  flavorText?: string | undefined
  width: number
  height: number
  fontSize: number
}) {
  let currentFontSize = fontSize

  while (currentFontSize >= MIN_FONT_SIZE) {
    const rulesLines = layoutText(rulesText, width, currentFontSize, {
      baseFill: TEXT_FILL,
      flavor: false,
    })
    const flavorLines = flavorText
      ? layoutText(flavorText, width, Math.max(currentFontSize - 1, MIN_FONT_SIZE), {
          baseFill: FLAVOR_FILL,
          flavor: true,
        })
      : []

    const rulesHeight = rulesLines.reduce((sum, line) => sum + line.height, 0)
    const flavorHeight = flavorLines.reduce((sum, line) => sum + line.height, 0)
    const dividerHeight = flavorLines.length > 0 && rulesLines.length > 0 ? 9 : 0
    const totalHeight = rulesHeight + dividerHeight + flavorHeight

    if (totalHeight <= height || currentFontSize === MIN_FONT_SIZE) {
      return {
        rulesLines,
        flavorLines,
        hasFlavor: flavorLines.length > 0,
      }
    }

    currentFontSize -= 1
  }

  return {
    rulesLines: [] as LineLayout[],
    flavorLines: [] as LineLayout[],
    hasFlavor: false,
  }
}

function layoutText(
  text: string,
  width: number,
  fontSize: number,
  options: { baseFill: string; flavor: boolean },
) {
  const styledTokens = buildStyledTokens(text, fontSize, options)
  const units = expandUnits(styledTokens)
  const lines: StyledToken[][] = []
  let currentLine: StyledToken[] = []
  let currentWidth = 0

  for (const unit of units) {
    if (unit.kind === 'break') {
      lines.push(trimLine(currentLine))
      currentLine = []
      currentWidth = 0
      continue
    }

    const unitWidth = measureToken(unit)
    const isWhitespace = unit.kind === 'text' && /^\s+$/.test(unit.value)

    if (!isWhitespace && currentLine.length > 0 && currentWidth + unitWidth > width) {
      lines.push(trimLine(currentLine))
      currentLine = []
      currentWidth = 0
    }

    if (isWhitespace && currentLine.length === 0) {
      continue
    }

    currentLine.push(unit)
    currentWidth += unitWidth
  }

  if (currentLine.length > 0 || lines.length === 0) {
    lines.push(trimLine(currentLine))
  }

  return lines.map(buildLineLayout)
}

function buildStyledTokens(
  text: string,
  fontSize: number,
  options: { baseFill: string; flavor: boolean },
) {
  const tokens = tokenizeManaText(text)
  const styledTokens: StyledToken[] = []
  let reminderDepth = 0

  for (const token of tokens) {
    if (token.kind === 'symbol') {
      const reminder = !options.flavor && reminderDepth > 0
      styledTokens.push({
        kind: 'symbol',
        value: token.value,
        fontSize: reminder ? Math.max(fontSize - 2, MIN_FONT_SIZE) : fontSize,
        fontFamily: RULES_FONT_FAMILY,
        fill: reminder ? REMINDER_FILL : options.baseFill,
        fontStyle: options.flavor ? 'italic' : 'normal',
      })
      continue
    }

    let current = ''
    let currentReminder = !options.flavor && reminderDepth > 0

    for (const char of token.value) {
      if (char === '\n') {
        if (current) {
          styledTokens.push(makeTextToken(current, fontSize, currentReminder, options))
          current = ''
        }
        styledTokens.push({
          kind: 'break',
          value: '\n',
          fontSize,
          fontFamily: RULES_FONT_FAMILY,
          fill: options.baseFill,
          fontStyle: options.flavor ? 'italic' : 'normal',
        })
        continue
      }

      const nextReminder = !options.flavor && (reminderDepth > 0 || char === '(')
      if (current && nextReminder !== currentReminder) {
        styledTokens.push(makeTextToken(current, fontSize, currentReminder, options))
        current = ''
      }

      currentReminder = nextReminder
      current += char

      if (char === '(') reminderDepth += 1
      if (char === ')') reminderDepth = Math.max(0, reminderDepth - 1)
    }

    if (current) {
      styledTokens.push(makeTextToken(current, fontSize, currentReminder, options))
    }
  }

  return styledTokens
}

function makeTextToken(
  value: string,
  fontSize: number,
  reminder: boolean,
  options: { baseFill: string; flavor: boolean },
): StyledToken {
  return {
    kind: 'text',
    value,
    fontSize: reminder ? Math.max(fontSize - 2, MIN_FONT_SIZE) : fontSize,
    fontFamily: RULES_FONT_FAMILY,
    fill: reminder ? REMINDER_FILL : options.baseFill,
    fontStyle: options.flavor ? 'italic' : 'normal',
  }
}

function expandUnits(tokens: StyledToken[]) {
  const units: StyledToken[] = []

  for (const token of tokens) {
    if (token.kind !== 'text') {
      units.push(token)
      continue
    }

    const parts = token.value.match(/\S+|\s+/g) ?? []
    for (const part of parts) {
      units.push({ ...token, value: part })
    }
  }

  return units
}

function trimLine(tokens: StyledToken[]) {
  const trimmed = [...tokens]

  while (trimmed.length > 0) {
    const last = trimmed[trimmed.length - 1]
    if (last?.kind === 'text' && /^\s+$/.test(last.value)) {
      trimmed.pop()
      continue
    }
    break
  }

  return trimmed
}

function buildLineLayout(tokens: StyledToken[]): LineLayout {
  if (tokens.length === 0) {
    return {
      segments: [],
      height: 18,
    }
  }

  const segments: LineSegment[] = []
  let current: LineSegment | null = null
  let lineHeight = 0

  for (const token of tokens) {
    const tokenText = token.kind === 'symbol' ? `{${token.value}}` : token.value
    const tokenWidth = measureToken(token)
    lineHeight = Math.max(lineHeight, token.fontSize * 1.18)

    if (
      current &&
      current.fontSize === token.fontSize &&
      current.fontFamily === token.fontFamily &&
      current.fill === token.fill &&
      current.fontStyle === token.fontStyle
    ) {
      current.text += tokenText
      current.width += tokenWidth
      continue
    }

    current = {
      text: tokenText,
      width: tokenWidth,
      fontSize: token.fontSize,
      fontFamily: token.fontFamily,
      fill: token.fill,
      fontStyle: token.fontStyle,
    }
    segments.push(current)
  }

  return {
    segments,
    height: lineHeight,
  }
}

function measureToken(token: StyledToken) {
  if (token.kind === 'symbol') {
    return token.fontSize * 1.1 + 1
  }

  return token.value.length * token.fontSize * 0.5
}
