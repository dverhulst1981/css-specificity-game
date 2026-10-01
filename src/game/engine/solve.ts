import type { Answer, Question, RuleSpec } from '../../types/question.ts'
import type { CascadeDeclaration, Specificity } from '../../types/specificity.ts'
import { compareSpecificity, sameSpec } from '../../types/specificity.ts'
import { winningDeclaration } from './cascade.ts'
import { answerIds, sameSelection } from './match.ts'
import { specificityOf } from './parse.ts'

export type BattleVerdict = 'a' | 'b' | 'tie'

export function solveSpecificity(selector: string): Specificity {
  return specificityOf(selector)
}

export function solveBattle(a: string, b: string): BattleVerdict {
  const compared = compareSpecificity(specificityOf(a), specificityOf(b))
  if (compared === 0) return 'tie'
  return compared > 0 ? 'a' : 'b'
}

export function declarationFromRule(rule: RuleSpec): CascadeDeclaration {
  return {
    id: rule.id,
    origin: rule.origin ?? 'author',
    important: Boolean(rule.important),
    layer: rule.layer ?? null,
    specificity: specificityOf(rule.selector),
    sourceOrder: rule.sourceOrder,
  }
}

export function solveRules(rules: RuleSpec[]): string {
  return winningDeclaration(rules.map(declarationFromRule)).id
}

export function expectedAnswer(question: Question): Answer {
  if (question.kind === 'specificity') {
    return { kind: 'specificity', value: question.answer }
  }
  if (question.kind === 'selector-battle') {
    return { kind: 'selector-battle', value: question.answer }
  }
  if (question.kind === 'who-matches') {
    return { kind: 'who-matches', ids: answerIds(question) }
  }
  return { kind: 'which-rule-wins', ruleId: question.answer }
}

export function isCorrect(question: Question, response: Answer | null): boolean {
  if (!response || response.kind !== question.kind) return false
  if (question.kind === 'specificity' && response.kind === 'specificity') {
    return sameSpec(question.answer, response.value)
  }
  if (question.kind === 'selector-battle' && response.kind === 'selector-battle') {
    return question.answer === response.value
  }
  if (question.kind === 'which-rule-wins' && response.kind === 'which-rule-wins') {
    return question.answer === response.ruleId
  }
  if (question.kind === 'who-matches' && response.kind === 'who-matches') {
    return sameSelection(answerIds(question), response.ids)
  }
  return false
}
