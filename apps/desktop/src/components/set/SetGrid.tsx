import { useQuery } from '@tanstack/react-query'
import { useEditorStore } from '../../stores/editorStore'
import { getDisplayName, getDisplayType } from '../../lib/cardFields'
import { MiniCardPreview } from '../cards/MiniCardPreview'

interface SetGridProps {
  setId: string
}

export function SetGrid({ setId }: SetGridProps) {
  const activeSet = useEditorStore((s) => s.activeSet)
  const setActiveCard = useEditorStore((s) => s.setActiveCard)

  const { data: cards = [] } = useQuery({
    queryKey: ['cards', setId],
    queryFn: () => window.api.cards.list(setId),
  })

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 text-center text-zinc-500">
        <p className="text-xl font-semibold text-zinc-300">
          {activeSet ? activeSet.name : 'This set'} is empty
        </p>
        <p className="max-w-md text-sm text-zinc-500">
          Use the card button in the sidebar to create your first card, then click it to open the editor.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-zinc-100">
          {activeSet ? activeSet.name : 'Set'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select a card to edit it.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
        {cards.map((card, i) => {
          const name = getDisplayName(card.fields, `Card ${i + 1}`)
          const typeLine = getDisplayType(card.fields)

          return (
            <button
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-zinc-800/40 focus:outline-none"
            >
              <MiniCardPreview card={card} index={i + 1} />
              <div className="w-full px-1 text-center">
                <span className="block truncate text-sm font-medium text-zinc-300">{name}</span>
                <span className="block truncate text-xs text-zinc-500">{typeLine}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
