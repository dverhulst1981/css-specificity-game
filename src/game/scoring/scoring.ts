import type { Question } from '../../types/question.ts'
import type { LevelProgress, Progress, StarCount } from '../../types/progress.ts'

export function xpForAnswer(difficulty: number, streakIncludingThis: number): number {
  const steps = Math.min(Math.max(streakIncludingThis, 0), 5)
  return Math.round(100 * difficulty * (1 + steps * 0.1))
}

export function starsFor(
  correct: number,
  total: number,
  trapsTotal: number,
  trapsCorrect: number,
): StarCount {
  if (total <= 0) return 0
  const ratio = correct / total
  if (ratio < 0.7) return 0
  if (ratio < 0.85) return 1
  if (ratio < 0.95) return 2
  if (trapsCorrect < trapsTotal) return 2
  return 3
}

export function levelStats(
  questions: Question[],
  correctIds: Set<string>,
): { correct: number; total: number; trapsTotal: number; trapsCorrect: number; ratio: number; stars: StarCount } {
  const total = questions.length
  const correct = questions.filter((question) => correctIds.has(question.id)).length
  const traps = questions.filter((question) => question.trap)
  const trapsCorrect = traps.filter((question) => correctIds.has(question.id)).length
  return {
    correct,
    total,
    trapsTotal: traps.length,
    trapsCorrect,
    ratio: total === 0 ? 0 : correct / total,
    stars: starsFor(correct, total, traps.length, trapsCorrect),
  }
}

export function isLevelUnlocked(level: number, progress: Progress): boolean {
  if (level <= 1) return true
  return (progress.levels[level - 1]?.bestStars ?? 0) >= 1
}

export function nextLevelAfter(level: number): number | null {
  if (level >= 5) return null
  return level + 1
}

export function mergeLevel(
  previous: LevelProgress | undefined,
  stars: StarCount,
  ratio: number,
  xp: number,
): LevelProgress {
  return {
    bestStars: Math.max(previous?.bestStars ?? 0, stars) as StarCount,
    bestRatio: Math.max(previous?.bestRatio ?? 0, ratio),
    attempts: (previous?.attempts ?? 0) + 1,
    xp: (previous?.xp ?? 0) + xp,
  }
}
