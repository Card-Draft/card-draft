import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { temporal } from 'zundo'
import type { CardDraftSet } from '@card-draft/core/types'

interface EditorState {
  // Sets
  availableSets: CardDraftSet[]
  activeSetId: string | null
  activeSet: CardDraftSet | null

  // Cards
  activeCardId: string | null

  // Field values for the active card (live, before debounced save)
  fieldValues: Record<string, string>
  isDirty: boolean

  // Actions
  setAvailableSets: (sets: CardDraftSet[]) => void
  setActiveSet: (setId: string | null) => void
  setActiveCard: (cardId: string | null) => void
  setFieldValue: (fieldId: string, value: string) => void
  setFieldValues: (values: Record<string, string>) => void
  updateSetName: (name: string) => void
  markClean: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  undo: () => void
  redo: () => void
}

// Temporal (undo/redo) tracks only field value changes
type TemporalState = Pick<EditorState, 'fieldValues'>

const editorStoreCreator: StateCreator<EditorState, [['temporal', unknown]], []> = (set, get) => ({
  availableSets: [],
  activeSetId: null,
  activeSet: null,
  activeCardId: null,
  fieldValues: {},
  isDirty: false,

  setAvailableSets: (sets) => {
    const current = get()

    if (sets.length === 0) {
      set({
        availableSets: [],
        activeSetId: null,
        activeSet: null,
        activeCardId: null,
        fieldValues: {},
        isDirty: false,
      })
      return
    }

    const nextActiveSet =
      (current.activeSetId ? sets.find((set) => set.id === current.activeSetId) : null) ?? sets[0]

    if (!nextActiveSet) {
      return
    }

    const sameSetSelected = current.activeSetId === nextActiveSet.id

    set({
      availableSets: sets,
      activeSetId: nextActiveSet.id,
      activeSet: nextActiveSet,
      activeCardId: sameSetSelected ? current.activeCardId : null,
      fieldValues: sameSetSelected ? current.fieldValues : {},
      isDirty: sameSetSelected ? current.isDirty : false,
    })
  },

  setActiveSet: (setId) => {
    const sets = get().availableSets
    const activeSet = setId ? (sets.find((s) => s.id === setId) ?? null) : null
    set({ activeSetId: setId, activeSet, activeCardId: null, fieldValues: {} })
  },

  setActiveCard: (cardId) => {
    if (get().activeCardId === cardId) {
      return
    }

    set({ activeCardId: cardId, fieldValues: {}, isDirty: false })
  },

  setFieldValue: (fieldId, value) => {
    set((s) => ({
      fieldValues: { ...s.fieldValues, [fieldId]: value },
      isDirty: true,
    }))
  },

  setFieldValues: (values) => {
    set({ fieldValues: values, isDirty: false })
  },

  updateSetName: (name) => {
    set((s) => ({
      activeSet: s.activeSet ? { ...s.activeSet, name } : null,
      availableSets: s.availableSets.map((set) =>
        set.id === s.activeSetId ? { ...set, name } : set,
      ),
    }))
    // Persist via IPC
    const { activeSetId } = get()
    if (activeSetId) {
      void window.api.sets.update(activeSetId, { name })
    }
  },

  markClean: () => set({ isDirty: false }),

  canUndo: (): boolean => useEditorStore.temporal.getState().pastStates.length > 0,
  canRedo: (): boolean => useEditorStore.temporal.getState().futureStates.length > 0,
  undo: (): void => useEditorStore.temporal.getState().undo(),
  redo: (): void => useEditorStore.temporal.getState().redo(),
})

export const useEditorStore = create<EditorState>()(
  temporal(editorStoreCreator, {
    // Only track fieldValues in undo history
    partialize: (state): TemporalState => ({ fieldValues: state.fieldValues }),
    limit: 100,
  }),
)
