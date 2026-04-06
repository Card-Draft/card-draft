import { useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function NewSetDialog() {
  const isOpen = useUiStore((s) => s.newSetDialogOpen)
  const close = useUiStore((s) => s.closeNewSetDialog)
  const setActiveSet = useEditorStore((s) => s.setActiveSet)
  const setAvailableSets = useEditorStore((s) => s.setAvailableSets)
  const availableSets = useEditorStore((s) => s.availableSets)
  const qc = useQueryClient()

  const [name, setName] = useState('My Custom Set')

  const create = useMutation({
    mutationFn: () =>
      window.api.sets.create({
        name,
        game: 'magic',
        templateId: 'magic-m15',
        metadata: '{}',
      }),
    onSuccess: (newSet) => {
      const updated = [...availableSets, newSet]
      setAvailableSets(updated)
      setActiveSet(newSet.id)
      void qc.invalidateQueries({ queryKey: ['sets'] })
      toast.success(`Set "${newSet.name}" created`)
      close()
      setName('My Custom Set')
    },
    onError: () => toast.error('Failed to create set'),
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      {/* Dialog */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">New Set</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Create a new card set to start designing.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400" htmlFor="set-name">
            Set Name
          </label>
          <input
            id="set-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create.mutate()}
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Game</label>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-400">
            Magic: The Gathering <span className="text-zinc-600">(more games coming in Phase 2)</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={close}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="flex-1 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {create.isPending ? 'Creating…' : 'Create Set'}
          </button>
        </div>
      </div>
    </div>
  )
}
