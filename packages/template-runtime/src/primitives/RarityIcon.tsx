import { useEffect, useMemo, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

export type GradientStop = { offset: number; color: string }

interface RarityIconProps {
  src: string
  x: number
  y: number
  size: number
  gradientStops?: GradientStop[]
  solidColor?: string
  strokeColor?: string | undefined
  strokeWidth?: number
}

const SHAPE_TAGS = new Set([
  'path',
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'rect',
  'line',
])

const BLACK_VALUES = new Set(['#000', '#000000', 'black', 'rgb(0,0,0)', 'rgba(0,0,0,1)'])
const WHITE_VALUES = new Set(['#fff', '#ffffff', 'white', 'rgb(255,255,255)', 'rgba(255,255,255,1)'])

function normalizePaint(value: string | null | undefined) {
  if (!value) return null
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function isBlackPaint(value: string | null | undefined) {
  const normalized = normalizePaint(value)
  return normalized ? BLACK_VALUES.has(normalized) : false
}

function isWhitePaint(value: string | null | undefined) {
  const normalized = normalizePaint(value)
  return normalized ? WHITE_VALUES.has(normalized) : false
}

function parseStyleMap(styleValue: string | null) {
  const entries = (styleValue ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, ...rest] = entry.split(':')
      return [key?.trim(), rest.join(':').trim()] as const
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry[0]))

  return new Map(entries)
}

function serializeStyleMap(styleMap: Map<string, string>) {
  return [...styleMap.entries()].map(([key, value]) => `${key}:${value}`).join(';')
}

function buildProcessedSvgMarkup(
  rawSvg: string,
  gradientStops: GradientStop[],
  solidColor: string,
  strokeColor: string | undefined,
) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml')
  const svg = doc.documentElement
  if (!svg || svg.tagName.toLowerCase() !== 'svg') {
    throw new Error('Invalid SVG')
  }

  const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const gradientId = `rarity-gradient-${Math.random().toString(36).slice(2, 10)}`

  if (gradientStops.length >= 2) {
    const gradient = doc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    gradient.setAttribute('id', gradientId)
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '100%')
    gradient.setAttribute('y2', '100%')

    for (const stop of gradientStops) {
      const stopNode = doc.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stopNode.setAttribute('offset', `${stop.offset * 100}%`)
      stopNode.setAttribute('stop-color', stop.color)
      gradient.appendChild(stopNode)
    }

    defs.appendChild(gradient)
  }

  svg.insertBefore(defs, svg.firstChild)

  const nodes = Array.from(svg.querySelectorAll('*'))
  for (const node of nodes) {
    const tag = node.tagName.toLowerCase()
    if (!SHAPE_TAGS.has(tag)) continue

    const styleMap = parseStyleMap(node.getAttribute('style'))
    const attrFill = node.getAttribute('fill')
    const attrStroke = node.getAttribute('stroke')
    const styleFill = styleMap.get('fill')
    const styleStroke = styleMap.get('stroke')
    const hasExplicitFill = attrFill !== null || styleFill !== undefined
    const fillPaint = styleFill ?? attrFill
    const strokePaint = styleStroke ?? attrStroke

    const shouldTreatDefaultFillAsBlack =
      !hasExplicitFill && tag !== 'line' && normalizePaint(strokePaint) !== 'none'

    const replaceFill =
      shouldTreatDefaultFillAsBlack ||
      isBlackPaint(fillPaint)

    if (replaceFill) {
      const nextFill = gradientStops.length >= 2 ? `url(#${gradientId})` : solidColor
      node.setAttribute('fill', nextFill)
      styleMap.delete('fill')
    } else if (isWhitePaint(fillPaint)) {
      node.setAttribute('fill', strokeColor ?? '#ffffff')
      styleMap.delete('fill')
    }

    if (isBlackPaint(strokePaint)) {
      const nextStroke = gradientStops.length >= 2 ? `url(#${gradientId})` : solidColor
      node.setAttribute('stroke', nextStroke)
      styleMap.delete('stroke')
    } else if (isWhitePaint(strokePaint)) {
      node.setAttribute('stroke', strokeColor ?? '#ffffff')
      styleMap.delete('stroke')
    }

    if (styleMap.size > 0) {
      node.setAttribute('style', serializeStyleMap(styleMap))
    } else {
      node.removeAttribute('style')
    }
  }

  return new XMLSerializer().serializeToString(doc)
}

async function readSvgText(src: string) {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Failed to read SVG: ${response.status}`)
  }
  return response.text()
}

export function RarityIcon({
  src,
  x,
  y,
  size,
  gradientStops = [],
  solidColor = '#000000',
  strokeColor,
}: RarityIconProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [image] = useImage(processedSrc ?? '')

  const gradientKey = useMemo(
    () => gradientStops.map((stop) => `${stop.offset}:${stop.color}`).join('|'),
    [gradientStops],
  )

  useEffect(() => {
    let cancelled = false
    let nextObjectUrl: string | null = null

    void (async () => {
      try {
        const rawSvg = await readSvgText(src)
        if (cancelled) return

        const markup = buildProcessedSvgMarkup(rawSvg, gradientStops, solidColor, strokeColor)
        const blob = new Blob([markup], { type: 'image/svg+xml' })
        nextObjectUrl = URL.createObjectURL(blob)

        if (cancelled) {
          URL.revokeObjectURL(nextObjectUrl)
          return
        }

        setProcessedSrc(nextObjectUrl)
        setObjectUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return nextObjectUrl
        })
      } catch {
        setProcessedSrc(src)
      }
    })()

    return () => {
      cancelled = true
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl)
    }
  }, [src, gradientKey, solidColor, strokeColor, gradientStops])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!image) return null

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
