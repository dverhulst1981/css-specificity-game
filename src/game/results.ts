import type { Question } from '../types/question.ts'
import type { AnswerRecord, StarCount } from '../types/progress.ts'

export type Mode = 'practice' | 'learn' | 'daily' | 'extra' | 'pass'

export type LevelResult = {
  level: number
  stars: StarCount
  correct: number
  total: number
  unlockedNext: boolean
}

export type ResultSummary = {
  mode: Mode
  title: string
  correct: number
  total: number
  xp: number
  bestStreak: number
  trapsMissed: number
  perLevel: LevelResult[]
  dailyBest: { correct: number; total: number; xp: number } | null
  replay: {
    mode: Mode
    set: { from: number; to: number } | null
    date?: string
  } | null
  pass?: {
    names: { a: string; b: string }
    xp: { a: number; b: number }
    hearts: { a: number; b: number }
    correct: { a: number; b: number }
    winner: 'a' | 'b' | 'tie'
  }
}

export function countCorrect(records: AnswerRecord[]): number {
  return records.filter((record) => record.correct).length
}

export function missedTraps(questions: Question[], records: AnswerRecord[]): number {
  const wrong = new Set(records.filter((record) => !record.correct).map((record) => record.questionId))
  return questions.filter((question) => question.trap && wrong.has(question.id)).length
}
