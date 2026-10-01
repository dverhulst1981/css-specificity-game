import { describe, expect, it } from 'vitest'
import { questions } from '../../data/questions/index.ts'
import { dailyQuestions } from './daily.ts'
import { parseSetHash } from './quizSet.ts'

describe('daily seed and quiz sets', () => {
  it('picks the same five questions for the same calendar date', () => {
    const first = dailyQuestions(questions, '2026-10-01').map((question) => question.id)
    const second = dailyQuestions(questions, '2026-10-01').map((question) => question.id)
    expect(first).toEqual(second)
    expect(first).toHaveLength(5)
    expect(new Set(first).size).toBe(5)
  })

  it('can change the set when the date changes', () => {
    const ids = new Set<string>()
    for (let day = 1; day <= 12; day += 1) {
      const iso = `2026-10-${String(day).padStart(2, '0')}`
      ids.add(dailyQuestions(questions, iso).map((question) => question.id).join(','))
    }
    expect(ids.size).toBeGreaterThan(1)
  })

  it('reads a level range from the hash', () => {
    expect(parseSetHash('#set=1-5')).toEqual({ from: 1, to: 5 })
    expect(parseSetHash('#set=3')).toEqual({ from: 3, to: 3 })
    expect(parseSetHash('#set=6')).toEqual({ from: 6, to: 6 })
    expect(parseSetHash('#set=6-7')).toBeNull()
    expect(parseSetHash('#set=5-1')).toBeNull()
    expect(parseSetHash('#set=9')).toBeNull()
    expect(parseSetHash('')).toBeNull()
  })
})
