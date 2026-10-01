import { describe, expect, it } from 'vitest'
import { generateQuestion, mulberry32 } from './generator.ts'
import { solveBattle, solveSpecificity } from './solve.ts'

describe('ungraded generator', () => {
  it('computes answers with the engine', () => {
    const rng = mulberry32(42)
    for (let index = 0; index < 30; index += 1) {
      const question = generateQuestion(rng, index)
      expect(question.graded).toBe(false)
      expect(question.kind === 'which-rule-wins').toBe(false)
      if (question.kind === 'specificity') {
        expect(question.answer).toEqual(solveSpecificity(question.selector))
      } else if (question.kind === 'selector-battle') {
        expect(question.answer).toBe(solveBattle(question.a, question.b))
      }
    }
  })
})
