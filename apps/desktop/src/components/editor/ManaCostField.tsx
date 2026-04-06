import { useEditorStore } from '../../stores/editorStore'
import { formatManaCostForInput, normalizeManaCostInput } from '../../lib/manaCost'

export function ManaCostField({
  fieldId,
  placeholder,
}: {
  fieldId: string
  placeholder: string
}) {
  const value = useEditorStore((s) => s.fieldValues[fieldId] ?? '')
  const setFieldValue = useEditorStore((s) => s.setFieldValue)

  return (
    <div className="relative">
      <input
        id={fieldId}
        value={formatManaCostForInput(value)}
        onChange={(event) => setFieldValue(fieldId, normalizeManaCostInput(event.target.value))}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm uppercase tracking-[0.08em] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <p className="mt-1 text-xs text-zinc-500">Type shorthand like `2WU` or `3GG`.</p>
    </div>
  )
}
