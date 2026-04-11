/**
 * FieldPanel — the right-hand property inspector.
 *
 * Auto-generates form controls from the active template's manifest fields.
 * Uses the editor store as the single source of truth for field values.
 */

import { useEditorStore } from '../../stores/editorStore'
import { useUiStore } from '../../stores/uiStore'
import {
  formatFieldNumber,
  getArtCropValues,
  getDefaultFieldValues,
  getMergedFieldValues,
} from '../../lib/cardFields'
import { ManaCostField } from './ManaCostField'

// The M15 manifest inline — Phase 2 loads this dynamically from the template
import manifest from '@card-draft/templates/magic-m15/manifest.json'
import type { FieldDefinition } from '@card-draft/core/types'
import { normalizeRulesTextSymbols } from '@card-draft/core'

interface FieldPanelProps {
  cardId: string
}

export function FieldPanel({ cardId: _cardId }: FieldPanelProps) {
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const setFieldValue = useEditorStore((s) => s.setFieldValue)
  const initialValues = getMergedFieldValues(fieldValues)

  const fields = manifest.fields as FieldDefinition[]
  const defaults = getDefaultFieldValues()

  // Evaluate conditionals — which fields to show
  // For Phase 1, evaluate isCreature directly
  const isCreature = (fieldValues['type'] ?? '').toLowerCase().includes('creature')

  return (
    <div className="space-y-5 px-4 py-4">
      {fields.map((field) => {
        if (field.id.startsWith('artCrop') || field.id === 'rarityIcon') return null

        // Skip conditional fields that don't apply
        if (field.conditional === 'isCreature' && !isCreature) return null

        return (
          <div key={field.id} className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300" htmlFor={field.id}>
              <span>
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
              {field.id === 'rulesText' ? <RulesTextHelp /> : null}
            </label>

            {field.type === 'select' && field.options ? (
              <select
                id={field.id}
                value={initialValues[field.id] ?? ''}
                onChange={(event) => setFieldValue(field.id, event.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            ) : field.type === 'mana' ? (
              <ManaCostField
                fieldId={field.id}
                placeholder="2WU"
              />
            ) : field.type === 'richtext' ? (
              <div className="relative">
                <textarea
                  id={field.id}
                  value={initialValues[field.id] ?? ''}
                  onChange={(event) => setFieldValue(field.id, event.target.value)}
                  onBlur={(event) => {
                    if (field.id !== 'rulesText') return
                    setFieldValue(field.id, normalizeRulesTextSymbols(event.target.value))
                  }}
                  rows={field.type === 'richtext' ? 4 : 2}
                  placeholder={defaults[field.id] ?? ''}
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            ) : field.type === 'image' ? (
              <ImageField fieldId={field.id} acceptSvg={field.id === 'rarityIcon'} />
            ) : (
              <input
                id={field.id}
                value={initialValues[field.id] ?? ''}
                onChange={(event) => setFieldValue(field.id, event.target.value)}
                placeholder={defaults[field.id] ?? ''}
                className={`w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500 ${
                  field.italic ? 'italic' : ''
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function RulesTextHelp() {
  return (
    <div className="group relative inline-flex items-center">
      <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-600 text-[10px] font-semibold text-zinc-400 transition-colors group-hover:border-zinc-400 group-hover:text-zinc-200">
        ?
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 text-xs leading-5 text-zinc-300 shadow-xl group-hover:block">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Formatting Shortcuts
        </div>
        <div><code>--</code> becomes an em dash <code>—</code></div>
        <div><code>-&gt;</code> becomes a right arrow <code>→</code></div>
        <div><code>...</code> becomes an ellipsis <code>…</code></div>
        <div><code>'</code> becomes a typographic apostrophe <code>’</code></div>
        <div><code>~</code> becomes this card&apos;s name</div>
      </div>
    </div>
  )
}

function ImageField({ fieldId, acceptSvg = false }: { fieldId: string; acceptSvg?: boolean }) {
  const setFieldValue = useEditorStore((s) => s.setFieldValue)
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const value = fieldValues[fieldId] ?? ''
  const imageLoadError = useUiStore((s) => s.imageLoadError)
  const setImageLoadError = useUiStore((s) => s.setImageLoadError)

  // Crop controls only apply to the art field
  const isArtField = fieldId === 'art'
  const { cropX, cropY, cropWidth, cropHeight } = getArtCropValues(fieldValues)
  const zoom = 1 / cropWidth
  const maxCropX = Math.max(0, 1 - cropWidth)
  const maxCropY = Math.max(0, 1 - cropHeight)

  const setCrop = (next: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>) => {
    const resolvedWidth = next.cropWidth ?? cropWidth
    const resolvedHeight = next.cropHeight ?? cropHeight
    const resolvedX = Math.min(Math.max(next.cropX ?? cropX, 0), 1 - resolvedWidth)
    const resolvedY = Math.min(Math.max(next.cropY ?? cropY, 0), 1 - resolvedHeight)

    setFieldValue('artCropWidth', formatFieldNumber(resolvedWidth))
    setFieldValue('artCropHeight', formatFieldNumber(resolvedHeight))
    setFieldValue('artCropX', formatFieldNumber(resolvedX))
    setFieldValue('artCropY', formatFieldNumber(resolvedY))
  }

  const handleZoomChange = (nextZoom: number) => {
    const boundedZoom = Math.min(Math.max(nextZoom, 1), 4)
    const nextWidth = 1 / boundedZoom
    const nextHeight = 1 / boundedZoom
    const centerX = cropX + cropWidth / 2
    const centerY = cropY + cropHeight / 2

    setCrop({
      cropWidth: nextWidth,
      cropHeight: nextHeight,
      cropX: centerX - nextWidth / 2,
      cropY: centerY - nextHeight / 2,
    })
  }

  const handlePick = async () => {
    const path = await window.api.dialog.openFile({
      filters: acceptSvg
        ? [{ name: 'SVG', extensions: ['svg'] }, { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
        : [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    })
    if (path) {
      const dataUrl = await window.api.dialog.readFileAsDataUrl(path)
      setImageLoadError(null)
      setFieldValue(fieldId, dataUrl)
      if (isArtField) setCrop({ cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 })
    }
  }

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt={isArtField ? 'Card art' : 'Icon'}
            className="w-full h-32 object-contain rounded border border-zinc-700 bg-zinc-900"
          />
          <button
            onClick={() => {
              setImageLoadError(null)
              setFieldValue(fieldId, '')
              if (isArtField) setCrop({ cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 })
            }}
            className="absolute top-1 right-1 bg-zinc-900/80 text-zinc-400 hover:text-red-400 rounded px-1.5 py-0.5 text-xs"
          >
            Remove
          </button>
        </div>
      ) : null}
      {imageLoadError && value && isArtField ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {imageLoadError}
        </div>
      ) : null}
      <button
        onClick={() => void handlePick()}
        className="w-full py-1.5 rounded border border-dashed border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
      >
        {value ? 'Change…' : 'Choose…'}
      </button>
      {isArtField && value ? (
        <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Art placement</span>
            <button
              onClick={() => setCrop({ cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 })}
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Reset
            </button>
          </div>

          <RangeControl
            label="Zoom"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            display={`${zoom.toFixed(2)}x`}
            onChange={handleZoomChange}
          />
          <RangeControl
            label="Horizontal"
            min={0}
            max={maxCropX}
            step={0.001}
            value={cropX}
            display={`${Math.round((maxCropX === 0 ? 0 : cropX / maxCropX) * 100)}%`}
            onChange={(nextCropX) => setCrop({ cropX: nextCropX })}
            disabled={maxCropX === 0}
          />
          <RangeControl
            label="Vertical"
            min={0}
            max={maxCropY}
            step={0.001}
            value={cropY}
            display={`${Math.round((maxCropY === 0 ? 0 : cropY / maxCropY) * 100)}%`}
            onChange={(nextCropY) => setCrop({ cropY: nextCropY })}
            disabled={maxCropY === 0}
          />
        </div>
      ) : null}
    </div>
  )
}

function RangeControl({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
  disabled = false,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  display: string
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      />
    </label>
  )
}
