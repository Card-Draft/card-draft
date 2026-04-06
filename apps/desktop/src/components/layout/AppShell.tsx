import { useUiStore } from '../../stores/uiStore'
import { useEditorStore } from '../../stores/editorStore'
import { TopBar } from './TopBar'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { BottomBar } from './BottomBar'
import { CardCanvas } from '../editor/CardCanvas'
import { SetGrid } from '../set/SetGrid'
import { NewSetDialog } from '../dialogs/NewSetDialog'
import { ImportMseDialog } from '../dialogs/ImportMseDialog'
import { cn } from '../../lib/utils'

export function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen)
  const activeSetId = useEditorStore((s) => s.activeSetId)
  const activeCardId = useEditorStore((s) => s.activeCardId)
  const availableSets = useEditorStore((s) => s.availableSets)

  const hasNoSets = availableSets.length === 0

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside
          className={cn(
            'flex-shrink-0 border-r border-zinc-800 transition-all duration-200 overflow-hidden',
            sidebarOpen ? 'w-60' : 'w-0',
          )}
        >
          {sidebarOpen && <LeftSidebar />}
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden flex items-center justify-center bg-zinc-900">
          {hasNoSets ? (
            <EmptyState />
          ) : activeCardId ? (
            <CardCanvas />
          ) : activeSetId ? (
            <SetGrid setId={activeSetId} />
          ) : (
            <EmptyState />
          )}
        </main>

        {/* Right panel */}
        <aside
          className={cn(
            'flex-shrink-0 border-l border-zinc-800 transition-all duration-200 overflow-hidden',
            rightPanelOpen ? 'w-72' : 'w-0',
          )}
        >
          {rightPanelOpen && <RightPanel />}
        </aside>
      </div>
      <BottomBar />
      <NewSetDialog />
      <ImportMseDialog />
    </div>
  )
}

function EmptyState() {
  const openNewSet = useUiStore((s) => s.openNewSetDialog)
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
      <div className="text-6xl">🃏</div>
      <p className="text-lg font-medium text-zinc-400">No sets yet</p>
      <p className="text-sm">Create a set to start designing cards</p>
      <button
        onClick={openNewSet}
        className="mt-2 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm transition-colors"
      >
        Create your first set
      </button>
    </div>
  )
}
