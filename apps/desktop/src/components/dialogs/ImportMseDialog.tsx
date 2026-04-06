import { useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseMseSet, mseCardToM15Fields } from '@card-draft/core/importer/mse-set'

export function ImportMseDialog() {
  const isOpen = useUiStore((s) => s.importMseDialogOpen)
  const close = useUiStore((s) => s.closeImportMseDialog)
  const setActiveSet = useEditorStore((s) => s.setActiveSet)
  const availableSets = useEditorStore((s) => s.availableSets)
  const setAvailableSets = useEditorStore((s) => s.setAvailableSets)
  const qc = useQueryClient()

  const [filePath, setFilePath] = useState<string | null>(null)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [setName, setSetName] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)

  const pickFile = async () => {
    const path = await window.api.dialog.openFile({
      filters: [{ name: 'MSE Set Files', extensions: ['mse-set'] }],
    })
    if (!path) return
    setFilePath(path)

    // Read file to preview card count
    try {
      const response = await fetch(`file://${path}`)
      const buffer = await response.arrayBuffer()
      const mseSet = await parseMseSet(buffer)
      setPreviewCount(mseSet.cards.length)
      setSetName(mseSet.name)
      setFileBuffer(buffer)
    } catch (e) {
      toast.error(`Could not read file: ${String(e)}`)
      setFilePath(null)
    }
  }

  const importSet = useMutation({
    mutationFn: async () => {
      if (!fileBuffer) throw new Error('No file loaded')

      const mseSet = await parseMseSet(fileBuffer)

      // Create the set
      const newSet = await window.api.sets.create({
        name: setName || mseSet.name,
        game: 'magic',
        templateId: 'magic-m15',
        metadata: '{}',
      })

      // Create cards
      for (const mseCard of mseSet.cards) {
        const fields = mseCardToM15Fields(mseCard)
        await window.api.cards.create({
          setId: newSet.id,
          templateId: 'magic-m15',
          fields: JSON.stringify(fields),
          artPath: null,
        })
      }

      return newSet
    },
    onSuccess: (newSet) => {
      const updated = [...availableSets, newSet]
      setAvailableSets(updated)
      setActiveSet(newSet.id)
      void qc.invalidateQueries({ queryKey: ['sets'] })
      toast.success(`Imported ${previewCount} cards into "${newSet.name}"`)
      close()
      reset()
    },
    onError: (e) => toast.error(`Import failed: ${String(e)}`),
  })

  const reset = () => {
    setFilePath(null)
    setPreviewCount(null)
    setSetName('')
    setFileBuffer(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Import from Magic Set Editor</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Import card data from a .mse-set file. You'll need to pick the equivalent template
            from the marketplace after import.
          </p>
        </div>

        {/* File picker */}
        <div className="space-y-2">
          <button
            onClick={() => void pickFile()}
            className="w-full py-3 rounded-lg border border-dashed border-zinc-700 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            {filePath ? `📄 ${filePath.split('/').pop()}` : 'Choose .mse-set file…'}
          </button>

          {previewCount !== null && (
            <p className="text-xs text-zinc-500 text-center">
              Found <span className="text-zinc-300 font-medium">{previewCount}</span> cards
            </p>
          )}
        </div>

        {/* Set name override */}
        {filePath && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Set Name</label>
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { close(); reset() }}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => importSet.mutate()}
            disabled={!fileBuffer || importSet.isPending}
            className="flex-1 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-40 transition-colors"
          >
            {importSet.isPending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
