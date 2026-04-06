import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { forwardRef } from 'react'

// Logical card dimensions — all template coordinates are in this space
export const CARD_WIDTH = 744
export const CARD_HEIGHT = 1039

interface CardCanvasProps {
  children: React.ReactNode
  scale?: number
  onStageReady?: (stage: Konva.Stage) => void
}

export const CardCanvas = forwardRef<Konva.Stage, CardCanvasProps>(function CardCanvas(
  { children, scale = 1, onStageReady },
  ref,
) {
  return (
    <Stage
      ref={ref}
      width={CARD_WIDTH * scale}
      height={CARD_HEIGHT * scale}
      scaleX={scale}
      scaleY={scale}
      onMount={(stage: Konva.Stage) => onStageReady?.(stage)}
    >
      <Layer>{children}</Layer>
    </Stage>
  )
})
