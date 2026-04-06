/**
 * FieldPanel — the right-hand property inspector.
 *
 * Auto-generates form controls from the active template's manifest fields.
 * Uses React Hook Form for state, syncs changes to editorStore on every change.
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useEditorStore } from '../../stores/editorStore'
import { getDefaultFieldValues, getMergedFieldValues } from '../../lib/cardFields'

// The M15 manifest inline — Phase 2 loads this dynamically from the template
import manifest from '@card-draft/templates/magic-m15/manifest.json'
import type { FieldDefinition } from '@card-draft/core/types'

interface FieldPanelProps {
  cardId: string
}

export function FieldPanel({ cardId }: FieldPanelProps) {
  const fieldValues = useEditorStore((s) => s.fieldValues)
  const setFieldValue = useEditorStore((s) => s.setFieldValue)
  const initialValues = getMergedFieldValues(fieldValues)

  const { register, reset, watch } = useForm<Record<string, string>>({
    defaultValues: initialValues,
  })

  // Reset form when card changes
  useEffect(() => {
    reset(initialValues)
  }, [cardId, initialValues, reset])

  // Sync form → store on every change
  useEffect(() => {
    const sub = watch((values) => {
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== fieldValues[k]) {
          setFieldValue(k, v)
        }
      })
    })
    return () => sub.unsubscribe()
  }, [watch, setFieldValue, fieldValues])

  const fields = manifest.fields as FieldDefinition[]
  const defaults = getDefaultFieldValues()

  // Evaluate conditionals — which fields to show
  // For Phase 1, evaluate isCreature directly
  const isCreature = (fieldValues['type'] ?? '').toLowerCase().includes('creature')

  return (
    <div className="space-y-5 px-4 py-4">
      {fields.map((field) => {
        // Skip conditional fields that don't apply
        if (field.conditional === 'isCreature' && !isCreature) return null

        return (
          <div key={field.id} className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {field.type === 'select' && field.options ? (
              <select
                id={field.id}
                {...register(field.id)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            ) : field.type === 'richtext' || field.type === 'mana' ? (
              <div className="relative">
                <textarea
                  id={field.id}
                  {...register(field.id)}
                  rows={field.type === 'richtext' ? 4 : 2}
                  placeholder={field.type === 'mana' ? '{W}{U}{B}{R}{G}' : defaults[field.id] ?? ''}
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                {field.type === 'mana' && (
                  <p className="mt-1 text-xs text-zinc-500">Use braces for symbols: {'{W}'} {'{2}'} {'{T}'}</p>
                )}
              </div>
            ) : field.type === 'image' ? (
              <ImageField fieldId={field.id} />
            ) : (
              <input
                id={field.id}
                {...register(field.id)}
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

function ImageField({ fieldId }: { fieldId: string }) {
  const setFieldValue = useEditorStore((s) => s.setFieldValue)
  const value = useEditorStore((s) => s.fieldValues[fieldId]) ?? ''

  const handlePick = async () => {
    const path = await window.api.dialog.openFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    })
    if (path) {
      // Use file:// URL for Konva to load
      setFieldValue(fieldId, `file://${path}`)
    }
  }

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Card art"
            className="w-full h-32 object-cover rounded border border-zinc-700"
          />
          <button
            onClick={() => setFieldValue(fieldId, '')}
            className="absolute top-1 right-1 bg-zinc-900/80 text-zinc-400 hover:text-red-400 rounded px-1.5 py-0.5 text-xs"
          >
            Remove
          </button>
        </div>
      ) : null}
      <button
        onClick={() => void handlePick()}
        className="w-full py-1.5 rounded border border-dashed border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
      >
        {value ? 'Change image…' : 'Choose image…'}
      </button>
    </div>
  )
}
