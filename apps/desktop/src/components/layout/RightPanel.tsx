import { useEditorStore } from '../../stores/editorStore'
import { FieldPanel } from '../editor/FieldPanel'

export function RightPanel() {
  const activeCardId = useEditorStore((s) => s.activeCardId)

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Properties
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeCardId ? (
          <FieldPanel cardId={activeCardId} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
            Select a card to edit its text, mana cost, art, and rules.
          </div>
        )}
      </div>
    </div>
  )
}
