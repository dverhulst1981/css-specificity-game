import { describe, expect, it } from 'vitest'
import { parseSetHash } from './quizSet.ts'

describe('quiz sets', () => {
  it('reads a level range from the hash', () => {
    expect(parseSetHash('#set=1-5')).toEqual({ from: 1, to: 5 })
    expect(parseSetHash('#set=3')).toEqual({ from: 3, to: 3 })
    expect(parseSetHash('#set=6')).toEqual({ from: 6, to: 6 })
    expect(parseSetHash('#set=6-7')).toEqual({ from: 6, to: 7 })
    expect(parseSetHash('#set=7')).toEqual({ from: 7, to: 7 })
    expect(parseSetHash('#set=8')).toBeNull()
    expect(parseSetHash('#set=5-1')).toBeNull()
    expect(parseSetHash('#set=9')).toBeNull()
    expect(parseSetHash('')).toBeNull()
  })
})
