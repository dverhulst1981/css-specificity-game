import type { Question } from '../../types/question.ts'
import { formatSpecificity } from '../../types/specificity.ts'
import { answerIds, elementLabel } from './match.ts'
import { declarationFromRule, solveBattle, tuplesTie } from './solve.ts'
import { specificityOf } from './parse.ts'

export type RungId = 'match' | 'importance' | 'layers' | 'specificity' | 'order'

export type RungState = 'lit' | 'dim' | 'locked'

export type RungView = {
  id: RungId
  label: string
  state: RungState
  detail: string
}

export function ladderFor(question: Question): RungView[] {
  if (question.kind === 'who-matches') return matchLadder(question)
  const tie = tuplesTie(question)
  return [
    {
      id: 'match',
      label: 'Welke regels matchen',
      state: 'dim',
      detail: 'In deze ronde matchen de selectors die je ziet. Matchen zelf is nog geen vraag.',
    },
    {
      id: 'importance',
      label: 'Origin en importance',
      state: 'locked',
      detail: '!important hoort hier, niet bij specificiteit. Dit niveau komt later.',
    },
    {
      id: 'layers',
      label: 'Cascade layers',
      state: 'locked',
      detail: 'Cascade layers bestaan in de vergelijker en zijn in deze levels nog gesloten.',
    },
    {
      id: 'specificity',
      label: 'Specificiteit',
      state: 'lit',
      detail: specificityDetail(question),
    },
    {
      id: 'order',
      label: 'Volgorde in de bron',
      state: tie ? 'lit' : 'dim',
      detail: tie
        ? 'De specificity waarden zijn gelijk. Dan wint de latere regel in de stylesheet.'
        : 'De specificity waarden verschillen, dus de volgorde in de bron beslist deze ronde niet.',
    },
  ]
}

function matchLadder(question: Extract<Question, { kind: 'who-matches' }>): RungView[] {
  const names = answerIds(question).map((id) => elementLabel(question.tree, id))
  const detail =
    names.length === 0
      ? 'Deze selector raakt geen enkel element in de HTML.'
      : names.length === 1
        ? `Deze selector raakt ${names[0]}.`
        : `Deze selector raakt ${names.length} elementen: ${names.join(', ')}.`
  return [
    {
      id: 'match',
      label: 'Welke regels matchen',
      state: 'lit',
      detail,
    },
    {
      id: 'importance',
      label: 'Origin en importance',
      state: 'locked',
      detail: '!important hoort hier, niet bij specificiteit. Dit niveau komt later.',
    },
    {
      id: 'layers',
      label: 'Cascade layers',
      state: 'locked',
      detail: 'Cascade layers bestaan in de vergelijker en zijn in deze levels nog gesloten.',
    },
    {
      id: 'specificity',
      label: 'Specificiteit',
      state: 'dim',
      detail: 'Matchen komt vóór de specificity waarde. Die tel je in de andere levels.',
    },
    {
      id: 'order',
      label: 'Volgorde in de bron',
      state: 'dim',
      detail: 'De volgorde in de bron beslist pas als de specificity waarden gelijk zijn.',
    },
  ]
}

function specificityDetail(question: Question): string {
  if (question.kind === 'specificity') {
    return `De specificity waarde is ${formatSpecificity(question.answer)}. De cijfers worden niet opgeteld.`
  }
  if (question.kind === 'selector-battle') {
    const left = formatSpecificity(specificityOf(question.a))
    const right = formatSpecificity(specificityOf(question.b))
    const verdict = solveBattle(question.a, question.b)
    const who = verdict === 'tie' ? 'Gelijk' : verdict === 'a' ? 'A wint' : 'B wint'
    return `A is ${left}. B is ${right}. ${who}.`
  }
  if (question.kind !== 'which-rule-wins') {
    return 'Matchen komt vóór de specificity waarde.'
  }
  const parts = question.rules
    .map((rule) => {
      const tuple = formatSpecificity(declarationFromRule(rule).specificity)
      return `${rule.selector} is ${tuple}`
    })
    .join('. ')
  return parts
}
