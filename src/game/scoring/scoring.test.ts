import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../../types/progress.ts'
import { evaluateBadges } from './badges.ts'
import { isLevelUnlocked, starsFor, xpForAnswer } from './scoring.ts'

describe('scoring', () => {
  it('adds 10% per correct answer up to 50%', () => {
    expect(xpForAnswer(1, 1)).toBe(110)
    expect(xpForAnswer(1, 5)).toBe(150)
    expect(xpForAnswer(1, 8)).toBe(150)
    expect(xpForAnswer(3, 2)).toBe(360)
    expect(xpForAnswer(2, 0)).toBe(200)
  })

  it('awards stars from the ratio and requires every trap for three', () => {
    expect(starsFor(6, 10, 1, 1)).toBe(0)
    expect(starsFor(7, 10, 1, 0)).toBe(1)
    expect(starsFor(8, 10, 0, 0)).toBe(1)
    expect(starsFor(9, 10, 1, 1)).toBe(2)
    expect(starsFor(10, 10, 2, 2)).toBe(3)
    expect(starsFor(10, 10, 2, 1)).toBe(2)
  })

  it('unlocks the next level at one star', () => {
    const progress = emptyProgress()
    expect(isLevelUnlocked(1, progress)).toBe(true)
    expect(isLevelUnlocked(2, progress)).toBe(false)
    progress.levels[1] = { bestStars: 1, bestRatio: 0.7, attempts: 1, xp: 100 }
    expect(isLevelUnlocked(2, progress)).toBe(true)
    expect(isLevelUnlocked(3, progress)).toBe(false)
  })

  it('keeps the last two badges locked', () => {
    const progress = emptyProgress()
    progress.levels[1] = { bestStars: 1, bestRatio: 1, attempts: 1, xp: 1 }
    progress.levels[2] = { bestStars: 2, bestRatio: 1, attempts: 1, xp: 1 }
    progress.levels[5] = { bestStars: 1, bestRatio: 0.8, attempts: 1, xp: 1 }
    progress.bestStreak = 5
    const badges = evaluateBadges(progress)
    expect(badges.filter((badge) => badge.earned).map((badge) => badge.id)).toEqual([
      'selector-rookie',
      'specificity-fighter',
      'id-hunter',
      'cascade-master',
    ])
    expect(badges.filter((badge) => badge.locked).map((badge) => badge.id)).toEqual([
      'css-wizard',
      'important-survivor',
    ])
  })
})
