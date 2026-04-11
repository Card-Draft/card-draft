import { Group, Rect, Text } from 'react-konva'
import {
  materializeRichInlineLineRange,
  prepareRichInline,
  walkRichInlineLineRanges,
  type RichInlineItem,
} from '@chenglou/pretext/rich-inline'
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
  fontFamily?: string
  italicFontFamily?: string
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
  pretextText?: string
  kind: 'text' | 'symbol'
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
const MIN_FONT_SIZE = 12
const FONT_SIZE_STEP = 0.5
const DEFAULT_RULES_FONT_FAMILY = 'Georgia'
const DEFAULT_RULES_ITALIC_FONT_FAMILY = 'Georgia'

function normalizeRulesDisplayText(text: string) {
  return text.replace(/--/g, '—')
}

export function RulesBox({
  x,
  y,
  width,
  height,
  rulesText,
  flavorText,
  fontSize = 16,
  symbolBasePath,
  background = 'rgba(255,255,255,0.85)',
  stroke = 'rgba(0,0,0,0.45)',
  strokeWidth = 2,
  cornerRadius = 6,
  fontFamily = DEFAULT_RULES_FONT_FAMILY,
  italicFontFamily = DEFAULT_RULES_ITALIC_FONT_FAMILY,
}: RulesBoxProps) {
  const padding = 16
  const rightSafetyInset = Math.max(56, fontSize * 2)
  const innerWidth = width - padding * 2 - rightSafetyInset
  const innerHeight = height - padding * 2
  const layout = fitRulesLayout({
    rulesText,
    flavorText,
    width: innerWidth,
    height: innerHeight,
    fontSize,
    fontFamily,
    italicFontFamily,
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

        if (segment.kind === 'text') {
          return (
            <Text
              key={`${key}-${index}`}
              x={segmentX}
              y={y}
              text={segment.text}
              fontSize={segment.fontSize}
              fontFamily={segment.fontFamily}
              fontStyle={segment.fontStyle}
              fill={segment.fill}
              wrap="none"
              listening={false}
            />
          )
        }

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
  fontFamily,
  italicFontFamily,
}: {
  rulesText: string
  flavorText?: string | undefined
  width: number
  height: number
  fontSize: number
  fontFamily: string
  italicFontFamily: string
}) {
  let currentFontSize = fontSize

  while (currentFontSize >= MIN_FONT_SIZE) {
    const rulesLines = layoutText(rulesText, width, currentFontSize, {
      baseFill: TEXT_FILL,
      flavor: false,
      fontFamily,
      italicFontFamily,
    })
    const flavorLines = flavorText
      ? layoutText(flavorText, width, Math.max(currentFontSize - 1.5, MIN_FONT_SIZE), {
          baseFill: FLAVOR_FILL,
          flavor: true,
          fontFamily,
          italicFontFamily,
        })
      : []

    const rulesHeight = rulesLines.reduce((sum, line) => sum + line.height, 0)
    const flavorHeight = flavorLines.reduce((sum, line) => sum + line.height, 0)
    const dividerHeight = flavorLines.length > 0 && rulesLines.length > 0 ? 9 : 0
    const totalHeight = rulesHeight + dividerHeight + flavorHeight

    if (totalHeight <= height || currentFontSize <= MIN_FONT_SIZE) {
      return {
        rulesLines,
        flavorLines,
        hasFlavor: flavorLines.length > 0,
      }
    }

    currentFontSize = Math.max(MIN_FONT_SIZE, currentFontSize - FONT_SIZE_STEP)
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
  options: {
    baseFill: string
    flavor: boolean
    fontFamily: string
    italicFontFamily: string
  },
) {
  const styledTokens = buildStyledTokens(normalizeRulesDisplayText(text), fontSize, options)
  const paragraphs: StyledToken[][] = []
  let currentParagraph: StyledToken[] = []

  for (const token of styledTokens) {
    if (token.kind === 'break') {
      paragraphs.push(trimLine(currentParagraph))
      currentParagraph = []
      continue
    }
    currentParagraph.push(token)
  }

  if (currentParagraph.length > 0 || paragraphs.length === 0) {
    paragraphs.push(trimLine(currentParagraph))
  }

  return paragraphs.flatMap((paragraph) => layoutParagraphWithPretext(paragraph, width, fontSize))
}

function buildStyledTokens(
  text: string,
  fontSize: number,
  options: {
    baseFill: string
    flavor: boolean
    fontFamily: string
    italicFontFamily: string
  },
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
        fontFamily: reminder || options.flavor ? options.italicFontFamily : options.fontFamily,
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
          fontFamily: options.flavor ? options.italicFontFamily : options.fontFamily,
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

interface RichLayoutItem extends RichInlineItem {
  kind: 'text' | 'symbol'
  renderText: string
  fontSize: number
  fontFamily: string
  fill: string
  fontStyle: 'normal' | 'italic'
  width: number
}

const SYMBOL_PLACEHOLDER = '\u2060'

function buildFontShorthand(token: Pick<StyledToken, 'fontStyle' | 'fontSize' | 'fontFamily'>) {
  const styleParts = token.fontStyle === 'italic' ? ['italic'] : []

  return [...styleParts, `${token.fontSize}px`, token.fontFamily].join(' ')
}

function buildRichLayoutItems(tokens: StyledToken[]): RichLayoutItem[] {
  return tokens
    .filter((token) => token.kind !== 'break')
    .map((token) => {
      const base = {
        font: buildFontShorthand(token),
        fontSize: token.fontSize,
        fontFamily: token.fontFamily,
        fill: token.fill,
        fontStyle: token.fontStyle,
      }

      if (token.kind === 'symbol') {
        return {
          ...base,
          kind: 'symbol' as const,
          text: SYMBOL_PLACEHOLDER,
          renderText: `{${token.value}}`,
          break: 'never' as const,
          width: measureToken(token),
          extraWidth: measureToken(token),
        }
      }

      return {
        ...base,
        kind: 'text' as const,
        text: token.value,
        renderText: token.value,
        width: 0,
      }
    })
}

function makeTextToken(
  value: string,
  fontSize: number,
  reminder: boolean,
  options: {
    baseFill: string
    flavor: boolean
    fontFamily: string
    italicFontFamily: string
  },
): StyledToken {
  return {
    kind: 'text',
    value,
    fontSize: reminder ? Math.max(fontSize - 2, MIN_FONT_SIZE) : fontSize,
    fontFamily: reminder || options.flavor ? options.italicFontFamily : options.fontFamily,
    fill: reminder ? REMINDER_FILL : options.baseFill,
    fontStyle: options.flavor ? 'italic' : 'normal',
  }
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

function buildBlankLine(fontSize: number) {
  return {
    segments: [] as LineSegment[],
    height: fontSize * 1.18,
  }
}

function layoutParagraphWithPretext(tokens: StyledToken[], width: number, fontSize: number): LineLayout[] {
  const richItems = buildRichLayoutItems(tokens)
  if (richItems.length === 0) {
    return [buildBlankLine(fontSize)]
  }

  const prepared = prepareRichInline(richItems)
  const lines: LineLayout[] = []

  walkRichInlineLineRanges(prepared, width, (range) => {
    const materialized = materializeRichInlineLineRange(prepared, range)
    const segments: LineSegment[] = []
    let lineHeight = fontSize * 1.18

    for (const fragment of materialized.fragments) {
      const item = richItems[fragment.itemIndex]
      if (!item) continue

      lineHeight = Math.max(lineHeight, item.fontSize * 1.18)
      const gapSegmentWidth = fragment.gapBefore

      if (gapSegmentWidth > 0) {
        segments.push({
          kind: 'text',
          text: ' ',
          pretextText: ' ',
          width: gapSegmentWidth,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily,
          fill: item.fill,
          fontStyle: item.fontStyle,
        })
      }

      segments.push({
        kind: item.kind,
        text: item.kind === 'symbol' ? item.renderText : fragment.text,
        pretextText: fragment.text,
        width: fragment.occupiedWidth,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        fill: item.fill,
        fontStyle: item.fontStyle,
      })
    }

    lines.push({
      segments,
      height: lineHeight,
    })
  })

  return lines.length > 0 ? lines : [buildBlankLine(fontSize)]
}

function measureToken(token: StyledToken) {
  if (token.kind === 'symbol') {
    return token.fontSize * 1.1 + 1
  }

  return token.value.length * token.fontSize * 0.5
}
