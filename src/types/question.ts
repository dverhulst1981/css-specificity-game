import type { CascadeLayer, Origin, Specificity } from './specificity.ts'

export type Difficulty = 1 | 2 | 3

export type LevelNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type RuleSpec = {
  id: string
  selector: string
  property: string
  value: string
  important?: boolean
  origin?: Origin
  layer?: CascadeLayer
  sourceOrder: number
}

type QuestionBase = {
  id: string
  level: LevelNumber
  difficulty: Difficulty
  graded: boolean
  trap?: boolean
  prompt: string
  lesson: string
  explanation: string
  trapLead?: string
}

export type SpecificityQuestion = QuestionBase & {
  kind: 'specificity'
  selector: string
  answer: Specificity
}

export type BattleQuestion = QuestionBase & {
  kind: 'selector-battle'
  a: string
  b: string
  answer: 'a' | 'b' | 'tie'
}

export type RuleQuestion = QuestionBase & {
  kind: 'which-rule-wins'
  html: string
  rules: RuleSpec[]
  answer: string
}

export type MatchNode = {
  id: string
  tag: string
  idAttr?: string
  className?: string
  attrs?: { name: string; value: string }[]
  text?: string
  children?: MatchNode[]
}

export type MatchQuestion = QuestionBase & {
  kind: 'who-matches'
  selector: string
  tree: MatchNode[]
  answer: string[]
}

export type Question = SpecificityQuestion | BattleQuestion | RuleQuestion | MatchQuestion

export type SpecificityAnswer = {
  kind: 'specificity'
  value: Specificity
}

export type BattleAnswer = {
  kind: 'selector-battle'
  value: 'a' | 'b' | 'tie'
}

export type RuleAnswer = {
  kind: 'which-rule-wins'
  ruleId: string
}

export type MatchAnswer = {
  kind: 'who-matches'
  ids: string[]
}

export type Answer = SpecificityAnswer | BattleAnswer | RuleAnswer | MatchAnswer
