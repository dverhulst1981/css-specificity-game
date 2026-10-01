import { questionById, questions } from '../data/questions/index.ts'
import type { Answer, Question } from '../types/question.ts'
import type { AnswerRecord, Progress, SavedRun } from '../types/progress.ts'
import { isCorrect } from './engine/solve.ts'
import { levelStats, mergeLevel, xpForAnswer } from './scoring/scoring.ts'

export function scoreResponse(
  question: Question,
  response: Answer | null,
  streakBefore: number,
  timedOut = false,
): { correct: boolean; xp: number; streak: number; record: AnswerRecord } {
  const correct = !timedOut && isCorrect(question, response)
  const streak = correct ? streakBefore + 1 : 0
  const xp = correct ? xpForAnswer(question.difficulty, streak) : 0
  return {
    correct,
    xp,
    streak,
    record: {
      questionId: question.id,
      correct,
      xp,
      response,
      timedOut,
    },
  }
}

export function applyBankResult(progress: Progress, asked: Question[], records: AnswerRecord[]): Progress {
  const correctIds = new Set(records.filter((record) => record.correct).map((record) => record.questionId))
  const levels = { ...progress.levels }
  let totalXp = progress.totalXp
  const grouped = new Map<number, Question[]>()
  for (const question of asked) {
    if (question.level < 1 || !question.graded) continue
    const list = grouped.get(question.level) ?? []
    list.push(question)
    grouped.set(question.level, list)
  }
  for (const [level, list] of grouped) {
    const stats = levelStats(list, correctIds)
    const xp = records
      .filter((record) => list.some((question) => question.id === record.questionId))
      .reduce((sum, record) => sum + record.xp, 0)
    levels[level] = mergeLevel(levels[level], stats.stars, stats.ratio, xp)
    totalXp += xp
  }
  return {
    ...progress,
    levels,
    totalXp,
    bestStreak: Math.max(progress.bestStreak, streakPeak(records)),
    continueRun: null,
  }
}

export function applyDailyResult(
  progress: Progress,
  isoDate: string,
  records: AnswerRecord[],
  total: number,
): Progress {
  const correct = records.filter((record) => record.correct).length
  const xp = records.reduce((sum, record) => sum + record.xp, 0)
  const previous = progress.daily[isoDate]
  const better =
    !previous || correct > previous.correct || (correct === previous.correct && xp > previous.xp)
  return {
    ...progress,
    bestStreak: Math.max(progress.bestStreak, streakPeak(records)),
    daily: better ? { ...progress.daily, [isoDate]: { correct, total, xp } } : progress.daily,
    continueRun: null,
  }
}

export function streakPeak(records: AnswerRecord[]): number {
  let streak = 0
  let best = 0
  for (const record of records) {
    streak = record.correct ? streak + 1 : 0
    best = Math.max(best, streak)
  }
  return best
}

export function questionsFromRun(run: SavedRun): Question[] {
  if (run.kind === 'extra' && run.extraQuestions) return run.extraQuestions
  return run.questionIds
    .map((id) => questionById(id))
    .filter((question): question is Question => Boolean(question))
}

export function bankQuestions(): Question[] {
  return questions
}

export function createRun(options: {
  mode: SavedRun['mode']
  pace: SavedRun['pace']
  asked: Question[]
  set: SavedRun['set']
  date?: string
}): SavedRun {
  return {
    kind: options.mode === 'extra' ? 'extra' : 'bank',
    mode: options.mode,
    pace: options.pace,
    questionIds: options.asked.map((question) => question.id),
    extraQuestions: options.mode === 'extra' ? options.asked : undefined,
    index: 0,
    phase: 'ask',
    streak: 0,
    xp: 0,
    records: [],
    set: options.set,
    date: options.date,
  }
}
