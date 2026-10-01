import { describe, expect, it } from 'vitest'
import { answerIds } from '../../game/engine/match.ts'
import { solveBattle, solveRules, solveSpecificity } from '../../game/engine/solve.ts'
import { matchQuestions, questions } from './index.ts'

describe('question bank', () => {
  it('holds the selection round as level 1 and twenty questions on each later level', () => {
    expect(questions.filter((question) => question.level === 1)).toHaveLength(matchQuestions.length)
    expect(questions.filter((question) => question.kind === 'who-matches')).toHaveLength(matchQuestions.length)
    for (const level of [2, 3, 4, 5, 6, 7]) {
      expect(questions.filter((question) => question.level === level)).toHaveLength(20)
    }
    expect(questions).toHaveLength(matchQuestions.length + 120)
    const traps = questions.filter((question) => question.trap)
    expect(traps.length).toBeGreaterThanOrEqual(8)
    expect(traps.length).toBeLessThanOrEqual(30)
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
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
      } else if (question.kind === 'which-rule-wins') {
        expect(question.answer).toBe(solveRules(question.rules))
        if (question.level <= 6) {
          expect(question.rules.every((rule) => !rule.important && !rule.layer)).toBe(true)
        }
      } else if (question.kind === 'who-matches') {
        expect(question.level).toBe(1)
        expect(question.answer).toEqual(answerIds(question))
      }
    }
  })
})
