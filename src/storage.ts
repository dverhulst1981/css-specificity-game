import { emptyProgress, type Progress, type SavedRun } from './types/progress.ts'
import type { ResultSummary } from './game/results.ts'
import { starsFor } from './game/scoring/scoring.ts'

const PROGRESS_KEY = 'specificiteit.v1'
const RESULT_KEY = 'specificiteit.result'

type StoredRun = {
  mode?: string
  kind?: string
  pace?: string
  questionIds?: unknown
  index?: number
  phase?: string
  streak?: number
  xp?: number
  records?: SavedRun['records']
  set?: { from: number; to: number } | null
}

type StoredProgress = Partial<Progress> & {
  schema?: number
  daily?: unknown
  continueRun?: StoredRun | null
  selectBest?: Progress['selectBest']
}

function isSoloMode(mode: string | undefined): mode is SavedRun['mode'] {
  return mode === 'practice' || mode === 'learn'
}

function sanitizeRun(run: StoredRun | null | undefined, shiftLevels: boolean): SavedRun | null {
  if (!run) return null
  if ((run.mode as string) === 'pass' || (run.kind as string) === 'pass') return null
  if (run.mode === 'daily' || run.mode === 'extra') return null

  let mode: SavedRun['mode'] | null = isSoloMode(run.mode) ? run.mode : null
  let set = run.set ?? null
  if (run.mode === 'select') {
    mode = 'practice'
    set = { from: 1, to: 1 }
  } else if (shiftLevels && set) {
    set = { from: set.from + 1, to: set.to + 1 }
  }
  if (!mode) return null
  return {
    kind: 'bank',
    mode,
    pace: run.pace === 'tempo' ? 'tempo' : 'steady',
    questionIds: Array.isArray(run.questionIds) ? run.questionIds.filter((id): id is string => typeof id === 'string') : [],
    index: typeof run.index === 'number' ? run.index : 0,
    phase: run.phase === 'feedback' ? 'feedback' : 'ask',
    streak: typeof run.streak === 'number' ? run.streak : 0,
    xp: typeof run.xp === 'number' ? run.xp : 0,
    records: Array.isArray(run.records) ? run.records : [],
    set,
  }
}

export function normalizeProgress(parsed: StoredProgress): Progress {
  const legacy = parsed.schema !== 2
  let levels = { ...(parsed.levels ?? {}) }
  let continueRun = sanitizeRun(parsed.continueRun, legacy)
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
  }
  return {
    ...emptyProgress(),
    levels,
    totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : 0,
    bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
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
