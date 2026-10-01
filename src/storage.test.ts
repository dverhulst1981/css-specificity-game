import { describe, expect, it } from 'vitest'
import { emptyProgress } from './types/progress.ts'
import { normalizeProgress } from './storage.ts'

describe('saved progress', () => {
  it('shifts the old six levels up and turns a selection record into level 1', () => {
    const progress = normalizeProgress({
      ...emptyProgress(),
      levels: {
        1: { bestStars: 3, bestRatio: 1, attempts: 2, xp: 40 },
        6: { bestStars: 1, bestRatio: 0.8, attempts: 1, xp: 10 },
      },
      selectBest: { correct: 9, total: 10, xp: 20 },
      continueRun: {
        kind: 'bank',
        mode: 'select',
        pace: 'steady',
        questionIds: ['sel-p'],
        index: 0,
        phase: 'ask',
        streak: 0,
        xp: 0,
        records: [],
        set: null,
      },
    })
    expect(progress.levels[1]?.bestStars).toBe(2)
    expect(progress.levels[2]?.bestStars).toBe(3)
    expect(progress.levels[7]?.bestStars).toBe(1)
    expect(progress.levels[6]).toBeUndefined()
    expect(progress.continueRun?.mode).toBe('practice')
    expect(progress.continueRun?.set).toEqual({ from: 1, to: 1 })
  })

  it('leaves a schema-2 save on the new level numbers', () => {
    const progress = normalizeProgress({
      schema: 2,
      ...emptyProgress(),
      levels: {
        1: { bestStars: 1, bestRatio: 0.8, attempts: 1, xp: 5 },
      },
    })
    expect(progress.levels[1]?.bestStars).toBe(1)
    expect(progress.levels[2]).toBeUndefined()
  })
})
