import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  zoom: number
  previewFitScale: number
  imageLoadError: string | null
  newSetDialogOpen: boolean
  exportDialogOpen: boolean
  importMseDialogOpen: boolean

  toggleSidebar: () => void
  toggleRightPanel: () => void
  setZoom: (zoom: number) => void
  setPreviewFitScale: (fitScale: number) => void
  setImageLoadError: (error: string | null) => void
  openNewSetDialog: () => void
  closeNewSetDialog: () => void
  openExportDialog: () => void
  closeExportDialog: () => void
  openImportMseDialog: () => void
  closeImportMseDialog: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  zoom: 1,
  previewFitScale: 1,
  imageLoadError: null,
  newSetDialogOpen: false,
  exportDialogOpen: false,
  importMseDialogOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setZoom: (zoom) => set({ zoom }),
  setPreviewFitScale: (previewFitScale) => set({ previewFitScale }),
  setImageLoadError: (imageLoadError) => set({ imageLoadError }),
  openNewSetDialog: () => set({ newSetDialogOpen: true }),
  closeNewSetDialog: () => set({ newSetDialogOpen: false }),
  openExportDialog: () => set({ exportDialogOpen: true }),
  closeExportDialog: () => set({ exportDialogOpen: false }),
  openImportMseDialog: () => set({ importMseDialogOpen: true }),
  closeImportMseDialog: () => set({ importMseDialogOpen: false }),
}))
