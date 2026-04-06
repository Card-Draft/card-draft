/**
 * CardCanvas — the main card editing canvas.
 *
 * Renders the active card using its template component inside a Konva Stage.
 * The stage ref is exposed so the export pipeline can call stage.toDataURL().
 */

import { useRef, useEffect, useCallback, Suspense, lazy } from 'react'
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
  const zoom = useUiStore((s) => s.zoom)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const setFieldValues = useEditorStore((s) => s.setFieldValues)
  const markClean = useEditorStore((s) => s.markClean)
  const isDirty = useEditorStore((s) => s.isDirty)

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

  const assetsPath = `file://${import.meta.env.DEV
    ? `${window.location.origin}/../../templates/magic-m15/assets`
    : '../templates/magic-m15/assets'}`

  return (
    <div className="flex items-center justify-center w-full h-full overflow-auto bg-zinc-900">
      {/* Checkerboard background communicates transparency */}
      <div
        className="relative shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
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
  )
}
