import { Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useUiStore } from '../../stores/uiStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import type { Card } from '@card-draft/core/types'
import { getDefaultFieldValues, getDisplayName, getDisplayType } from '../../lib/cardFields'
import { MiniCardPreview } from '../cards/MiniCardPreview'

export function LeftSidebar() {
  const availableSets = useEditorStore((s) => s.availableSets)
  const activeSetId = useEditorStore((s) => s.activeSetId)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const setActiveSet = useEditorStore((s) => s.setActiveSet)
  const setAvailableSets = useEditorStore((s) => s.setAvailableSets)
  const setActiveCard = useEditorStore((s) => s.setActiveCard)
  const openNewSetDialog = useUiStore((s) => s.openNewSetDialog)
  const qc = useQueryClient()

  const { data: cards = [] } = useQuery({
    queryKey: ['cards', activeSetId],
    queryFn: () => (activeSetId ? window.api.cards.list(activeSetId) : Promise.resolve([])),
    enabled: !!activeSetId,
  })

  const createCard = useMutation({
    mutationFn: () => {
      if (!activeSetId) {
        throw new Error('No active set selected')
      }

      return window.api.cards.create({
        setId: activeSetId,
        templateId: 'magic-m15',
        fields: JSON.stringify(getDefaultFieldValues()),
        artPath: null,
      })
    },
    onSuccess: (card) => {
      void qc.invalidateQueries({ queryKey: ['cards', activeSetId] })
      setActiveCard(card.id)
    },
    onError: () => toast.error('Failed to create card'),
  })

  const deleteCard = useMutation({
    mutationFn: (id: string) => window.api.cards.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cards', activeSetId] })
      setActiveCard(null)
    },
  })

  const deleteSet = useMutation({
    mutationFn: async (setId: string) => {
      await window.api.sets.delete(setId)
      return setId
    },
    onSuccess: async (deletedSetId) => {
      const remainingSets = availableSets.filter((set) => set.id !== deletedSetId)
      setAvailableSets(remainingSets)
      await qc.invalidateQueries({ queryKey: ['sets'] })
      toast.success('Set deleted')
    },
    onError: () => toast.error('Failed to delete set'),
  })

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) =>
      window.api.cards.reorder(activeSetId!, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', activeSetId] }),
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id)
      const newIndex = cards.findIndex((c) => c.id === over.id)
      const reordered = arrayMove(cards, oldIndex, newIndex)
      reorder.mutate(reordered.map((c) => c.id))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sets
          </span>
          <button
            onClick={openNewSetDialog}
            title="Create set"
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-1">
          {availableSets.map((set) => (
            <div
              key={set.id}
              className={`group flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors ${
                set.id === activeSetId
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <button
                onClick={() => setActiveSet(set.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium">{set.name}</span>
                <span className="block text-[11px] uppercase tracking-wide text-zinc-500">
                  {set.game}
                </span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete set "${set.name}"? This removes its cards too.`)) {
                    deleteSet.mutate(set.id)
                  }
                }}
                className="rounded p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-950/60 hover:text-red-400 group-hover:opacity-100"
                title="Delete set"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Cards
        </span>
        <button
          onClick={() => createCard.mutate()}
          disabled={!activeSetId}
          title="Add card"
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card, i) => (
              <SortableCardItem
                key={card.id}
                card={card}
                index={i}
                isActive={card.id === activeCardId}
                onSelect={() => setActiveCard(card.id)}
                onDelete={() => deleteCard.mutate(card.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center text-zinc-600">
            <p className="text-sm font-medium text-zinc-500">No cards in this set yet</p>
            <button
              onClick={() => createCard.mutate()}
              disabled={!activeSetId}
              className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
            >
              Create card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableCardItem({
  card,
  index,
  isActive,
  onSelect,
  onDelete,
}: {
  card: Card
  index: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cardName = getDisplayName(card.fields, `Card ${index + 1}`)
  const cardType = getDisplayType(card.fields)

  return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex cursor-pointer items-start gap-3 border-b border-zinc-800/50 px-3 py-2.5 transition-colors hover:bg-zinc-800/50 ${
          isActive ? 'bg-zinc-800' : ''
        }`}
        onClick={onSelect}
      >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab flex-shrink-0 text-zinc-700 hover:text-zinc-500 active:cursor-grabbing"
      >
        ⠿
      </div>

      <MiniCardPreview card={card} index={index + 1} compact className="w-12 flex-shrink-0" />

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-300">{cardName}</span>
        <span className="block truncate text-xs text-zinc-500">{cardType}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex-shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
