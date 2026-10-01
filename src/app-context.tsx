import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseSetHash, type LevelRange } from './game/levels/quizSet.ts'
import type { SavedRun } from './types/progress.ts'
import type { Progress } from './types/progress.ts'
import { loadProgress, saveProgress } from './storage.ts'

type AppContextValue = {
  path: string
  progress: Progress
  persistent: boolean
  range: LevelRange | null
  navigate: (path: string) => void
  updateProgress: (progress: Progress) => void
  begin: (run: SavedRun) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)
  const [hash, setHash] = useState(() => window.location.hash)
  const loaded = loadProgress()
  const [progress, setProgress] = useState<Progress>(loaded.progress)
  const [persistent, setPersistent] = useState(loaded.persistent)

  useEffect(() => {
    function sync() {
      setPath(window.location.pathname)
      setHash(window.location.hash)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const value = useMemo<AppContextValue>(() => {
    return {
      path,
      progress,
      persistent,
      range: parseSetHash(hash),
      navigate(next: string) {
        const url = `${next}${window.location.hash}`
        window.history.pushState({}, '', url)
        setPath(next)
      },
      updateProgress(next: Progress) {
        setProgress(next)
        setPersistent(saveProgress(next))
      },
      begin(run: SavedRun) {
        const next = { ...progress, continueRun: run }
        setProgress(next)
        setPersistent(saveProgress(next))
        const url = `/spelen${window.location.hash}`
        window.history.pushState({}, '', url)
        setPath('/spelen')
      },
    }
  }, [path, progress, persistent, hash])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('AppContext ontbreekt')
  return value
}
