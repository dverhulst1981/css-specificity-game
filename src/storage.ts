import { emptyProgress, type Progress, type SavedRun } from './types/progress.ts'
import type { ResultSummary } from './game/results.ts'
import { starsFor } from './game/scoring/scoring.ts'

const PROGRESS_KEY = 'specificiteit.v1'
const RESULT_KEY = 'specificiteit.result'

type StoredProgress = Partial<Progress> & { schema?: number }

export function normalizeProgress(parsed: StoredProgress): Progress {
  const legacy = parsed.schema !== 2
  const savedRun = parsed.continueRun
  let continueRun: SavedRun | null =
    savedRun && (savedRun.mode as string) !== 'pass' && (savedRun.kind as string) !== 'pass' ? savedRun : null
  let levels = { ...(parsed.levels ?? {}) }
  if (legacy) {
    const shifted: Progress['levels'] = {}
    for (const [key, value] of Object.entries(levels)) {
      const level = Number(key)
      if (!value || !Number.isInteger(level) || level < 1) continue
      shifted[level + 1] = value
    }
    const best = parsed.selectBest
    if (best && best.total > 0) {
      const stars = starsFor(best.correct, best.total, 0, 0)
      if (stars > 0) {
        shifted[1] = {
          bestStars: stars,
          bestRatio: best.correct / best.total,
          attempts: 1,
          xp: best.xp,
        }
      }
    }
    levels = shifted
    if (continueRun?.mode === 'select') {
      continueRun = { ...continueRun, mode: 'practice', set: { from: 1, to: 1 } }
    } else if (continueRun?.set) {
      continueRun = {
        ...continueRun,
        set: { from: continueRun.set.from + 1, to: continueRun.set.to + 1 },
      }
    }
  }
  return {
    ...emptyProgress(),
    ...parsed,
    levels,
    daily: parsed.daily ?? {},
    selectBest: parsed.selectBest ?? null,
    continueRun,
  }
}

export function loadProgress(): { progress: Progress; persistent: boolean } {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { progress: emptyProgress(), persistent: true }
    const parsed = JSON.parse(raw) as StoredProgress
    return { progress: normalizeProgress(parsed), persistent: true }
  } catch {
    return { progress: emptyProgress(), persistent: false }
  }
}

export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, schema: 2 }))
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
