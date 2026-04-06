import { useEffect, useRef } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { toast } from 'sonner'

/**
 * Manages debounced auto-save for the active card's field values.
 * Call this once at the top level of the card editor.
 */
export function useCardAutoSave(debounceMs = 500) {
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const isDirty = useEditorStore((s) => s.isDirty)
  const markClean = useEditorStore((s) => s.markClean)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || !activeCardId) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await window.api.cards.update(activeCardId, { fields: JSON.stringify(fieldValues) })
        markClean()
      } catch {
        toast.error('Auto-save failed')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fieldValues, isDirty, activeCardId, markClean, debounceMs])
}
