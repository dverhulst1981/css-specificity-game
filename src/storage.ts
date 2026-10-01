import { emptyProgress, type Progress } from './types/progress.ts'
import type { ResultSummary } from './game/results.ts'

const PROGRESS_KEY = 'specificiteit.v1'
const RESULT_KEY = 'specificiteit.result'

export function loadProgress(): { progress: Progress; persistent: boolean } {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { progress: emptyProgress(), persistent: true }
    const parsed = JSON.parse(raw) as Partial<Progress>
    const savedRun = parsed.continueRun
    const continueRun =
      savedRun && (savedRun.mode as string) !== 'pass' && (savedRun.kind as string) !== 'pass' ? savedRun : null
    return {
      progress: {
        ...emptyProgress(),
        ...parsed,
        levels: parsed.levels ?? {},
        daily: parsed.daily ?? {},
        selectBest: parsed.selectBest ?? null,
        continueRun,
      },
      persistent: true,
    }
  } catch {
    return { progress: emptyProgress(), persistent: false }
  }
}

export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function saveResult(result: ResultSummary): void {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function loadResult(): ResultSummary | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ResultSummary
  } catch {
    return null
  }
}
