import type { Answer } from './question.ts'

export type StarCount = 0 | 1 | 2 | 3

export type LevelProgress = {
  bestStars: StarCount
  bestRatio: number
  attempts: number
  xp: number
}

export type AnswerRecord = {
  questionId: string
  correct: boolean
  xp: number
  response: Answer | null
  timedOut?: boolean
}

export type SavedRun = {
  kind: 'bank'
  mode: 'practice' | 'learn'
  pace: 'steady' | 'tempo'
  questionIds: string[]
  index: number
  phase: 'ask' | 'feedback'
  streak: number
  xp: number
  records: AnswerRecord[]
  set: { from: number; to: number } | null
}

export type Progress = {
  levels: Partial<Record<number, LevelProgress>>
  totalXp: number
  bestStreak: number
  selectBest: { correct: number; total: number; xp: number } | null
  continueRun: SavedRun | null
}

export function emptyProgress(): Progress {
  return {
    levels: {},
    totalXp: 0,
    bestStreak: 0,
    selectBest: null,
    continueRun: null,
  }
}
