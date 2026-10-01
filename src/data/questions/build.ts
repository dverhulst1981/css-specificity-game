import type {
  BattleQuestion,
  Difficulty,
  Question,
  RuleQuestion,
  RuleSpec,
  SpecificityQuestion,
} from '../../types/question.ts'
import { spec, type Specificity } from '../../types/specificity.ts'

type Common = {
  id: string
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7
  difficulty: Difficulty
  prompt: string
  lesson: string
  explanation: string
  trap?: boolean
  trapLead?: string
}

export function tuple(ids: number, classes: number, elements: number): Specificity {
  return spec(0, ids, classes, elements)
}

export function specificityQuestion(
  input: Common & { selector: string; answer: Specificity },
): SpecificityQuestion {
  return { kind: 'specificity', graded: true, ...input }
}

export function battleQuestion(
  input: Common & { a: string; b: string; answer: 'a' | 'b' | 'tie' },
): BattleQuestion {
  return { kind: 'selector-battle', graded: true, ...input }
}

export function ruleQuestion(
  input: Common & { html: string; rules: RuleSpec[]; answer: string },
): RuleQuestion {
  return { kind: 'which-rule-wins', graded: true, ...input }
}

export const INK = 'oklch(0.32 0.03 55)'
export const HONEY = 'oklch(0.50 0.145 58)'
export const CHALK = 'oklch(0.36 0.09 255)'

export function rule(
  id: string,
  selector: string,
  value: string,
  sourceOrder: number,
  property = 'color',
): RuleSpec {
  return { id, selector, property, value, sourceOrder }
}

export function importantRule(id: string, selector: string, value: string, sourceOrder: number): RuleSpec {
  return { ...rule(id, selector, value, sourceOrder), important: true }
}

export function layerRule(
  id: string,
  selector: string,
  value: string,
  sourceOrder: number,
  layer: { order: number; name: string },
  important = false,
): RuleSpec {
  return { ...rule(id, selector, value, sourceOrder), important: important || undefined, layer }
}

export type { Question }
