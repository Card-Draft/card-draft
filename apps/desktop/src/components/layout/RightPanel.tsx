import { useEditorStore } from '../../stores/editorStore'
import { FieldPanel } from '../editor/FieldPanel'
import { parseSetMetadata } from '../../lib/setMetadata'

export function RightPanel() {
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const activeSet = useEditorStore((s) => s.activeSet)

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Properties
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeSet ? <SetPanel /> : null}
        {activeCardId ? (
          <FieldPanel cardId={activeCardId} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
            {activeSet
              ? 'Select a card to edit its text, mana cost, art, and rules.'
              : 'Select or create a set to edit set-wide properties.'}
          </div>
        )}
      </div>
    </div>
  )
}

function SetPanel() {
  const activeSet = useEditorStore((s) => s.activeSet)
  const updateSetRarityIcon = useEditorStore((s) => s.updateSetRarityIcon)
  const rarityIcon = parseSetMetadata(activeSet?.metadata).rarityIcon ?? ''

  const handlePick = async () => {
    const path = await window.api.dialog.openFile({
      filters: [{ name: 'SVG', extensions: ['svg'] }],
    })
    if (!path) return

    const dataUrl = await window.api.dialog.readFileAsDataUrl(path)
    updateSetRarityIcon(dataUrl)
  }

  if (!activeSet) return null

  return (
    <div className="border-b border-zinc-800 px-4 py-4 space-y-3">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Set
        </div>
        <div className="text-sm text-zinc-300">{activeSet.name}</div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Rarity Icon (Set-wide SVG)</label>
        {rarityIcon ? (
          <div className="relative">
            <img
              src={rarityIcon}
              alt="Set rarity icon"
              className="h-32 w-full rounded border border-zinc-700 bg-zinc-900 object-contain"
            />
            <button
              onClick={() => updateSetRarityIcon('')}
              className="absolute top-1 right-1 rounded bg-zinc-900/80 px-1.5 py-0.5 text-xs text-zinc-400 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : null}
        <button
          onClick={() => void handlePick()}
          className="w-full rounded border border-dashed border-zinc-700 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
        >
          {rarityIcon ? 'Change Set Icon…' : 'Choose Set Icon…'}
        </button>
      </div>
    </div>
  )
}
