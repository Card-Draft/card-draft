/**
 * RarityIcon — renders an uploaded SVG icon with a rarity gradient or solid fill
 * composited onto its alpha mask.
 *
 * Technique:
 *   1. Draw the gradient (or solid color) onto an offscreen canvas
 *   2. Draw the SVG image on top using globalCompositeOperation='destination-in'
 *      → only pixels where the SVG is opaque survive, painted with the gradient
 *   3. For common rarity, draw a shadow outline behind the filled shape for contrast
 *   4. Use the composited canvas as a Konva Image source
 */

import { useEffect, useRef, useState } from 'react'
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
  strokeColor?: string
  strokeWidth?: number
}

export function RarityIcon({
  src,
  x,
  y,
  size,
  gradientStops = [],
  solidColor = '#000000',
  strokeColor,
  strokeWidth = 2,
}: RarityIconProps) {
  const [svgImage, svgStatus] = useImage(src)
  // Use a counter to force a new canvas object reference on each composite so Konva re-renders
  const [, setTick] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!svgImage || svgStatus !== 'loaded') return

    // 2× for crisp rendering at display size
    const scale = 2
    const dim = size * scale

    const canvas = document.createElement('canvas')
    canvas.width = dim
    canvas.height = dim
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Step 1: fill (gradient or solid)
    if (gradientStops.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, dim, dim)
      for (const stop of gradientStops) {
        grad.addColorStop(stop.offset, stop.color)
      }
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = solidColor
    }
    ctx.fillRect(0, 0, dim, dim)

    // Step 2: mask to SVG shape
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(svgImage, 0, 0, dim, dim)
    ctx.globalCompositeOperation = 'source-over'

    // Step 3: contrast outline drawn behind the filled shape
    if (strokeColor && strokeWidth > 0) {
      const outlineCanvas = document.createElement('canvas')
      outlineCanvas.width = dim
      outlineCanvas.height = dim
      const oCtx = outlineCanvas.getContext('2d')
      if (oCtx) {
        oCtx.shadowColor = strokeColor
        oCtx.shadowBlur = strokeWidth * scale * 2
        oCtx.drawImage(svgImage, 0, 0, dim, dim)
        ctx.globalCompositeOperation = 'destination-over'
        ctx.drawImage(outlineCanvas, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    canvasRef.current = canvas
    // New canvas object → Konva sees the change
    setTick((t) => t + 1)
  }, [svgImage, svgStatus, size, gradientStops, solidColor, strokeColor, strokeWidth])

  if (!canvasRef.current) return null

  return (
    <KonvaImage
      x={x}
      y={y}
      width={size}
      height={size}
      image={canvasRef.current}
      listening={false}
    />
  )
}
