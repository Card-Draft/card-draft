import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useEditorStore } from './stores/editorStore'
import { useQuery } from '@tanstack/react-query'
import { Toaster } from 'sonner'

export default function App() {
  const setActiveSets = useEditorStore((s) => s.setAvailableSets)

  const { data: sets } = useQuery({
    queryKey: ['sets'],
    queryFn: () => window.api.sets.list(),
  })

  useEffect(() => {
    if (sets) setActiveSets(sets)
  }, [sets, setActiveSets])

  return (
    <>
      <AppShell />
      <Toaster position="bottom-right" theme="dark" richColors />
    </>
  )
}
