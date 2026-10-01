import type { Answer, Question, RuleSpec } from '../types/question.ts'
import { formatSpecificity } from '../types/specificity.ts'
import { answerIds, describeSelection } from './engine/match.ts'

export function formatDeclaration(rule: RuleSpec): string {
  const bang = rule.important ? ' !important' : ''
  const body = `${rule.selector} { ${rule.property}: ${rule.value}${bang}; }`
  return rule.layer?.name ? `@layer ${rule.layer.name} ${body}` : body
}

export function describeAnswer(question: Question, response: Answer | null): string {
  if (!response) return 'geen antwoord'
  if (response.kind === 'specificity') return formatSpecificity(response.value)
  if (question.kind === 'selector-battle' && response.kind === 'selector-battle') {
    if (response.value === 'tie') return 'gelijk'
    return response.value === 'a' ? question.a : question.b
  }
  if (question.kind === 'which-rule-wins' && response.kind === 'which-rule-wins') {
    const rule = question.rules.find((item) => item.id === response.ruleId)
    return rule ? formatDeclaration(rule) : response.ruleId
  }
  if (question.kind === 'who-matches' && response.kind === 'who-matches') {
    return describeSelection(question, response.ids)
  }
  return 'geen antwoord'
}

export function correctNotation(question: Question): string {
  if (question.kind === 'specificity') return formatSpecificity(question.answer)
  if (question.kind === 'selector-battle') {
    if (question.answer === 'tie') return 'gelijk'
    return question.answer === 'a' ? question.a : question.b
  }
  if (question.kind === 'who-matches') return describeSelection(question, answerIds(question))
  const rule = question.rules.find((item) => item.id === question.answer)
  return rule ? formatDeclaration(rule) : question.answer
}
