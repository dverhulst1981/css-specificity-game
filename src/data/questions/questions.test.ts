import { describe, expect, it } from 'vitest'
import { solveBattle, solveRules, solveSpecificity } from '../../game/engine/solve.ts'
import { questions } from './index.ts'

describe('question bank', () => {
  it('holds 100 graded questions, twenty per level, and about eight traps', () => {
    expect(questions).toHaveLength(100)
    for (const level of [1, 2, 3, 4, 5]) {
      expect(questions.filter((question) => question.level === level)).toHaveLength(20)
    }
    const traps = questions.filter((question) => question.trap)
    expect(traps.length).toBeGreaterThanOrEqual(8)
    expect(traps.length).toBeLessThanOrEqual(14)
    expect(new Set(questions.map((question) => question.id)).size).toBe(100)
    expect(questions.every((question) => question.graded)).toBe(true)
    expect(questions.some((question) => question.kind === 'specificity')).toBe(true)
    expect(questions.some((question) => question.kind === 'selector-battle')).toBe(true)
    expect(questions.some((question) => question.kind === 'which-rule-wins')).toBe(true)
  })

  it('stores the answer the engine computes', () => {
    for (const question of questions) {
      expect(question.prompt.length).toBeGreaterThan(0)
      expect(question.explanation.length).toBeGreaterThan(0)
      if (question.trap) expect(question.trapLead?.length).toBeGreaterThan(0)
      if (question.kind === 'specificity') {
        expect(question.answer).toEqual(solveSpecificity(question.selector))
      } else if (question.kind === 'selector-battle') {
        expect(question.answer).toBe(solveBattle(question.a, question.b))
      } else {
        expect(question.answer).toBe(solveRules(question.rules))
        expect(question.rules.every((rule) => !rule.important && !rule.layer)).toBe(true)
      }
    }
  })
})
