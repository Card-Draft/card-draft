import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { useQuery } from '@tanstack/react-query'
import { ZoomIn, ZoomOut } from 'lucide-react'

export function BottomBar() {
  const zoom = useUiStore((s) => s.zoom)
  const previewFitScale = useUiStore((s) => s.previewFitScale)
  const setZoom = useUiStore((s) => s.setZoom)
  const activeSetId = useEditorStore((s) => s.activeSetId)
  const effectiveScale = previewFitScale * zoom

  let zoomLabel = `${Math.round(effectiveScale * 100)}%`
  if (Math.abs(zoom - 1) < 0.01) {
    zoomLabel = `Fit · ${Math.round(effectiveScale * 100)}%`
  } else if (Math.abs(effectiveScale - 1) < 0.02) {
    zoomLabel = '100%'
  } else if (Math.abs(effectiveScale - 2) < 0.04) {
    zoomLabel = '200%'
  }

  const { data: cards = [] } = useQuery({
    queryKey: ['cards', activeSetId],
    queryFn: () => (activeSetId ? window.api.cards.list(activeSetId) : Promise.resolve([])),
    enabled: !!activeSetId,
  })

  return (
    <footer className="flex items-center justify-between h-7 px-3 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-500 flex-shrink-0">
      <span>{activeSetId ? `${cards.length} card${cards.length !== 1 ? 's' : ''}` : ''}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          className="hover:text-zinc-300 transition-colors"
        >
          <ZoomOut size={12} />
        </button>
        <span className="min-w-20 text-center">{zoomLabel}</span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          className="hover:text-zinc-300 transition-colors"
        >
          <ZoomIn size={12} />
        </button>
      </div>
    </footer>
  )
}
