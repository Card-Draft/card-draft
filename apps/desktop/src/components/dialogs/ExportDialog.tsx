import { useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EXPORT_PRESETS, type ExportPreset } from '@card-draft/core/export/png'
import { buildPrintSheet } from '@card-draft/core/export/pdf'
import { globalStageRef } from '../editor/CardCanvas'
import { HiddenCardRenderer, renderCardImageForExport } from '../export/HiddenCardRenderer'

export function ExportDialog() {
  const isOpen = useUiStore((s) => s.exportDialogOpen)
  const close = useUiStore((s) => s.closeExportDialog)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const activeSetId = useEditorStore((s) => s.activeSetId)
  const activeSet = useEditorStore((s) => s.activeSet)
  const fieldValues = useEditorStore((s) => s.fieldValues)

  const [preset, setPreset] = useState<ExportPreset>('print300')
  const [format, setFormat] = useState<'png' | 'pdf'>('png')
  const [range, setRange] = useState<'card' | 'set'>('card')
  const [exporting, setExporting] = useState(false)

  const { data: cards = [] } = useQuery({
    queryKey: ['cards', activeSetId],
    queryFn: () => (activeSetId ? window.api.cards.list(activeSetId) : []),
    enabled: !!activeSetId,
  })

  if (!isOpen) return null

  const resolution = EXPORT_PRESETS[preset]

  async function handleExport() {
    setExporting(true)
    try {
      if (format === 'png') {
        await exportPng()
      } else {
        await exportPdf()
      }
      toast.success('Export complete')
      close()
    } catch (e) {
      toast.error(`Export failed: ${String(e)}`)
    } finally {
      setExporting(false)
    }
  }

  async function exportPng() {
    if (range === 'card') {
      const dataUrl = await buildCurrentCardDataUrl()
      const cardName = 'card'
      const path = await window.api.export.pickSavePath({
        defaultName: `${cardName}.png`,
        ext: 'png',
      })
      if (!path) return
      await window.api.export.png({ cardId: activeCardId!, pixelRatio: resolution.pixelRatio, outputPath: path, dataUrl } as Parameters<typeof window.api.export.png>[0] & { dataUrl: string })
    } else {
      // Batch export: one PNG per card
      const folder = await window.api.export.pickFolder()
      if (!folder) return
      for (const card of cards) {
        const serializedFields =
          card.id === activeCardId ? JSON.stringify(fieldValues) : card.fields ?? '{}'
        const dataUrl = await renderCardImageForExport({
          serializedFields,
          serializedSetMetadata: activeSet?.metadata,
          pixelRatio: resolution.pixelRatio,
        })
        const safeName = card.id.slice(0, 8)
        await window.api.export.png({
          cardId: card.id,
          pixelRatio: resolution.pixelRatio,
          outputPath: `${folder}/${safeName}.png`,
          dataUrl,
        } as Parameters<typeof window.api.export.png>[0] & { dataUrl: string })
      }
    }
  }

  async function exportPdf() {
    const allUrls = range === 'card' ? [await buildCurrentCardDataUrl()] : await buildSetCardDataUrls()

    const pdfBytes = await buildPrintSheet({
      cardDataUrls: allUrls,
      cardsPerRow: 3,
      cardsPerColumn: 3,
      bleedInches: 0.125,
      pageSize: 'Letter',
    })

    const path = await window.api.export.pickSavePath({ defaultName: 'cards.pdf', ext: 'pdf' })
    if (!path) return
    await window.api.export.pdf({ pdfBytes, outputPath: path } as Parameters<typeof window.api.export.pdf>[0] & { pdfBytes: Uint8Array })
  }

  async function buildCurrentCardDataUrl() {
    if (globalStageRef) {
      return globalStageRef.toDataURL({ pixelRatio: resolution.pixelRatio })
    }

    return renderCardImageForExport({
      serializedFields: JSON.stringify(fieldValues),
      serializedSetMetadata: activeSet?.metadata,
      pixelRatio: resolution.pixelRatio,
    })
  }

  async function buildSetCardDataUrls() {
    const dataUrls: string[] = []

    for (const card of cards) {
      dataUrls.push(
        await renderCardImageForExport({
          serializedFields: card.id === activeCardId ? JSON.stringify(fieldValues) : card.fields ?? '{}',
          serializedSetMetadata: activeSet?.metadata,
          pixelRatio: resolution.pixelRatio,
        }),
      )
    }

    return dataUrls
  }

  return (
    <>
      <HiddenCardRenderer />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={close} />
        <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Export Cards</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Choose resolution, format, and range.</p>
          </div>

          {/* Preset */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Resolution Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EXPORT_PRESETS) as ExportPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`py-2 px-3 rounded-lg border text-xs text-left transition-colors ${
                    preset === p
                      ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className="font-medium">{EXPORT_PRESETS[p].label.split('(')[0]?.trim()}</div>
                  <div className="text-zinc-600">{EXPORT_PRESETS[p].outputWidth}×{EXPORT_PRESETS[p].outputHeight}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Format</label>
            <div className="flex gap-2">
              {(['png', 'pdf'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    format === f
                      ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  {f.toUpperCase()}
                  {f === 'pdf' && <span className="ml-1 text-xs text-zinc-600">(print sheet)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Range</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRange('card')}
                disabled={!activeCardId}
                className={`flex-1 py-2 rounded-lg border text-sm transition-colors disabled:opacity-40 ${
                  range === 'card'
                    ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                This card
              </button>
              <button
                onClick={() => setRange('set')}
                disabled={!activeSetId}
                className={`flex-1 py-2 rounded-lg border text-sm transition-colors disabled:opacity-40 ${
                  range === 'set'
                    ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                Entire set ({cards.length})
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={close}
              className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleExport()}
              disabled={exporting}
              className="flex-1 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-40 transition-colors"
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
