import type { Answer, Question } from './question.ts'

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
  kind: 'bank' | 'extra'
  mode: 'practice' | 'learn' | 'daily' | 'extra'
  pace: 'steady' | 'tempo'
  questionIds: string[]
  extraQuestions?: Question[]
  index: number
  phase: 'ask' | 'feedback'
  streak: number
  xp: number
  records: AnswerRecord[]
  set: { from: number; to: number } | null
  date?: string
}

export type Progress = {
  levels: Partial<Record<number, LevelProgress>>
  totalXp: number
  bestStreak: number
  daily: Record<string, { correct: number; total: number; xp: number }>
  continueRun: SavedRun | null
}

export function emptyProgress(): Progress {
  return {
    levels: {},
    totalXp: 0,
    bestStreak: 0,
    daily: {},
    continueRun: null,
  }
}
