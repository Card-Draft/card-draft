/**
 * CardCanvas — the main card editing canvas.
 *
 * Renders the active card using its template component inside a Konva Stage.
 * The stage ref is exposed so the export pipeline can call stage.toDataURL().
 */

import { useRef, useEffect, useCallback, Suspense, lazy, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useEditorStore } from '../../stores/editorStore'
import { useUiStore } from '../../stores/uiStore'
import { useQuery } from '@tanstack/react-query'
import { CARD_WIDTH, CARD_HEIGHT } from '@card-draft/template-runtime'
import { toast } from 'sonner'
import type { M15Fields } from '@card-draft/templates/magic-m15/fields'
import { getMergedFieldValues, parseCardFields } from '../../lib/cardFields'

// Expose the stage ref globally so the export dialog can access it
// This avoids prop-drilling the ref through many layers
export let globalStageRef: Konva.Stage | null = null

// Lazy-load the M15 template — in Phase 2 this becomes dynamic based on templateId
const M15Template = lazy(() => import('@card-draft/templates/magic-m15/template'))

export function CardCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoom = useUiStore((s) => s.zoom)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const setFieldValues = useEditorStore((s) => s.setFieldValues)
  const markClean = useEditorStore((s) => s.markClean)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setZoom = useUiStore((s) => s.setZoom)
  const setPreviewFitScale = useUiStore((s) => s.setPreviewFitScale)
  const setImageLoadError = useUiStore((s) => s.setImageLoadError)
  const [fitScale, setFitScale] = useState(1)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // Load card from DB when activeCardId changes
  const { data: card } = useQuery({
    queryKey: ['card', activeCardId],
    queryFn: () => (activeCardId ? window.api.cards.get(activeCardId) : null),
    enabled: !!activeCardId,
  })

  // Populate field values when card loads
  useEffect(() => {
    if (card) {
      setFieldValues(getMergedFieldValues(parseCardFields(card.fields)))
    }
  }, [card, setFieldValues])

  // Expose stage ref globally for export
  useEffect(() => {
    globalStageRef = stageRef.current
    return () => { globalStageRef = null }
  }, [stageRef.current])

  useEffect(() => {
    const handleImageStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string | null }>
      setImageLoadError(customEvent.detail?.error ?? null)
    }

    window.addEventListener('card-draft:image-status', handleImageStatus as EventListener)
    return () =>
      window.removeEventListener('card-draft:image-status', handleImageStatus as EventListener)
  }, [setImageLoadError])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateFitScale = () => {
      const padding = 48
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      })
      const widthScale = (viewport.clientWidth - padding) / CARD_WIDTH
      const heightScale = (viewport.clientHeight - padding) / CARD_HEIGHT
      const nextFitScale = Math.min(widthScale, heightScale, 1)
      const resolvedFitScale = Number.isFinite(nextFitScale) && nextFitScale > 0 ? nextFitScale : 1
      setFitScale(resolvedFitScale)
      setPreviewFitScale(resolvedFitScale)
    }

    updateFitScale()

    const observer = new ResizeObserver(() => {
      updateFitScale()
    })

    observer.observe(viewport)
    return () => {
      observer.disconnect()
      setPreviewFitScale(1)
    }
  }, [setPreviewFitScale])

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty || !activeCardId) return
    const timer = setTimeout(async () => {
      try {
        await window.api.cards.update(activeCardId, { fields: JSON.stringify(fieldValues) })
        markClean()
      } catch {
        toast.error('Failed to save card')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [fieldValues, isDirty, activeCardId, markClean])

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) { if (canRedo()) redo() }
        else { if (canUndo()) undo() }
      }
    },
    [undo, redo, canUndo, canRedo],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!activeCardId) return null

  const mergedFields = getMergedFieldValues(fieldValues)
  const effectiveScale = fitScale * zoom
  const scaledWidth = CARD_WIDTH * effectiveScale
  const scaledHeight = CARD_HEIGHT * effectiveScale
  const canvasPadding = 48
  const canvasSpaceWidth = Math.max(viewportSize.width, scaledWidth + canvasPadding * 2)
  const canvasSpaceHeight = Math.max(viewportSize.height, scaledHeight + canvasPadding * 2)
  const canvasLeft = Math.max((canvasSpaceWidth - scaledWidth) / 2, canvasPadding)
  const canvasTop = Math.max((canvasSpaceHeight - scaledHeight) / 2, canvasPadding)

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.altKey && !event.ctrlKey) return

    event.preventDefault()

    const nextZoom = Math.min(4, Math.max(0.25, zoom * Math.exp(-event.deltaY * 0.0025)))
    setZoom(nextZoom)
  }

  const setActualScale = (scale: number) => {
    if (fitScale <= 0) return
    setZoom(Math.min(4, Math.max(0.25, scale / fitScale)))
  }

  const assetsPath = `file://${import.meta.env.DEV
    ? `${window.location.origin}/../../templates/magic-m15/assets`
    : '../templates/magic-m15/assets'}`

  return (
    <div className="flex h-full w-full bg-zinc-900 p-5">
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2147483647] flex items-start justify-between px-3 pt-3">
          <div className="rounded-full border border-zinc-800/80 bg-zinc-950/90 px-3 py-1 text-xs text-zinc-500 shadow-lg backdrop-blur">
            Hold Option and scroll, or pinch, to zoom
          </div>

          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-950/95 p-1 shadow-lg backdrop-blur">
            <ZoomPresetButton active={Math.abs(zoom - 1) < 0.01} onClick={() => setZoom(1)}>
              Fit
            </ZoomPresetButton>
            <ZoomPresetButton active={Math.abs(effectiveScale - 1) < 0.02} onClick={() => setActualScale(1)}>
              100%
            </ZoomPresetButton>
            <ZoomPresetButton active={Math.abs(effectiveScale - 2) < 0.04} onClick={() => setActualScale(2)}>
              200%
            </ZoomPresetButton>
          </div>
        </div>

        <div
          ref={viewportRef}
          onWheel={handleViewportWheel}
          className="h-full w-full overflow-auto rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_35%),linear-gradient(180deg,#171717,#111111)]"
        >
        <div
          className="relative min-h-full min-w-full transition-[width,height] duration-75 ease-out"
          style={{ width: canvasSpaceWidth, height: canvasSpaceHeight }}
        >
          <div
            className="absolute origin-top-left shadow-2xl"
            style={{ left: canvasLeft, top: canvasTop, transform: `scale(${effectiveScale})` }}
          >
            <Stage ref={stageRef} width={CARD_WIDTH} height={CARD_HEIGHT}>
              <Layer>
                <Suspense fallback={null}>
                  <M15Template
                    fields={mergedFields as unknown as M15Fields}
                    assetsPath={assetsPath}
                  />
                </Suspense>
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function ZoomPresetButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
        active
          ? 'bg-zinc-100 text-zinc-950'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}
