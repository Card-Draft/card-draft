import { PanelLeft, PanelRight, Undo2, Redo2, Download, Menu, FolderUp, ArrowLeft } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { ExportDialog } from '../dialogs/ExportDialog'

export function TopBar() {
  const isMac = window.api.system.platform === 'darwin'
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel)
  const openExport = useUiStore((s) => s.openExportDialog)
  const openNewSet = useUiStore((s) => s.openNewSetDialog)
  const openImport = useUiStore((s) => s.openImportMseDialog)

  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const activeSet = useEditorStore((s) => s.activeSet)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const setActiveCard = useEditorStore((s) => s.setActiveCard)
  const updateSetName = useEditorStore((s) => s.updateSetName)

  return (
    <header className="drag-region flex items-center h-11 px-3 border-b border-zinc-800 bg-zinc-950 flex-shrink-0 gap-2">
      {/* macOS traffic light spacer */}
      {isMac && <div className="w-16 flex-shrink-0" />}

      <div className="no-drag flex items-center gap-1">
        <IconButton onClick={toggleSidebar} title="Toggle sidebar">
          <PanelLeft size={16} />
        </IconButton>
        <IconButton onClick={openNewSet} title="New set">
          <Menu size={16} />
        </IconButton>
        <IconButton onClick={openImport} title="Import MSE set">
          <FolderUp size={16} />
        </IconButton>
        {activeCardId && (
          <IconButton onClick={() => setActiveCard(null)} title="Back to set">
            <ArrowLeft size={16} />
          </IconButton>
        )}
      </div>

      {/* Set name (editable) */}
      <div className="no-drag flex-1 flex justify-center">
        {activeSet ? (
          <input
            value={activeSet.name}
            onChange={(e) => updateSetName(e.target.value)}
            className="bg-transparent text-sm font-medium text-zinc-200 text-center focus:outline-none focus:ring-1 focus:ring-zinc-600 rounded px-2 py-0.5 w-64 truncate"
          />
        ) : (
          <span className="text-sm text-zinc-500">Card Draft</span>
        )}
      </div>

      <div className="no-drag flex items-center gap-1">
        <IconButton onClick={undo} disabled={!canUndo()} title="Undo (⌘Z)">
          <Undo2 size={16} />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo()} title="Redo (⌘⇧Z)">
          <Redo2 size={16} />
        </IconButton>
        <div className="w-px h-4 bg-zinc-700 mx-1" />
        <IconButton onClick={openExport} title="Export">
          <Download size={16} />
        </IconButton>
        <IconButton onClick={toggleRightPanel} title="Toggle properties panel">
          <PanelRight size={16} />
        </IconButton>
      </div>
      <ExportDialog />
    </header>
  )
}

function IconButton({
  children,
  onClick,
  title,
  disabled = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}
