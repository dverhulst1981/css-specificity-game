import type { Question } from '../../types/question.ts'
import { formatSpecificity } from '../../types/specificity.ts'
import { solveBattle, solveSpecificity } from './solve.ts'

const ELEMENTS = ['p', 'div', 'span', 'a', 'button', 'h1', 'li', 'section', 'article', 'nav']
const CLASSES = ['title', 'card', 'active', 'intro', 'btn', 'note']
const IDS = ['app', 'nav', 'main', 'modal']
const ATTRIBUTES = ['[hidden]', '[disabled]', '[type="text"]', '[href]']
const PSEUDOS = [':hover', ':focus', ':disabled']
const ELEMENTS_PSEUDO = ['::before', '::after']

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

function specificitySelector(rng: () => number): { selector: string; difficulty: 1 | 2 | 3 } {
  const roll = rng()
  if (roll < 0.15) return { selector: pick(rng, ELEMENTS), difficulty: 1 }
  if (roll < 0.3) return { selector: `.${pick(rng, CLASSES)}`, difficulty: 1 }
  if (roll < 0.42) return { selector: `#${pick(rng, IDS)}`, difficulty: 1 }
  if (roll < 0.55) {
    return {
      selector: `${pick(rng, ELEMENTS)}${pick(rng, PSEUDOS)}`,
      difficulty: 2,
    }
  }
  if (roll < 0.68) {
    return {
      selector: `.${pick(rng, CLASSES)} .${pick(rng, CLASSES)}`,
      difficulty: 2,
    }
  }
  if (roll < 0.78) {
    return {
      selector: `#${pick(rng, IDS)} .${pick(rng, CLASSES)}`,
      difficulty: 2,
    }
  }
  if (roll < 0.86) {
    return {
      selector: `${pick(rng, ELEMENTS)}${pick(rng, ATTRIBUTES)}`,
      difficulty: 2,
    }
  }
  if (roll < 0.93) {
    return {
      selector: `:is(#${pick(rng, IDS)}, .${pick(rng, CLASSES)})`,
      difficulty: 3,
    }
  }
  return {
    selector: `:nth-child(n of .${pick(rng, CLASSES)})`,
    difficulty: 3,
  }
}

function battleSelector(rng: () => number): string {
  const roll = rng()
  if (roll < 0.25) return pick(rng, ELEMENTS)
  if (roll < 0.45) return `.${pick(rng, CLASSES)}`
  if (roll < 0.6) return `#${pick(rng, IDS)}`
  if (roll < 0.75) return `${pick(rng, ELEMENTS)}${pick(rng, ELEMENTS_PSEUDO)}`
  if (roll < 0.88) return `.${pick(rng, CLASSES)}.${pick(rng, CLASSES)}`
  return `:where(#${pick(rng, IDS)}) .${pick(rng, CLASSES)}`
}

function lessonFor(selector: string): string {
  return `Lees ${selector} van links naar rechts. Combinators en * voegen niets toe. Tel daarna de vier kolommen apart.`
}

export function generateQuestion(rng: () => number, index: number): Question {
  if (rng() < 0.55) {
    const built = specificitySelector(rng)
    const answer = solveSpecificity(built.selector)
    return {
      id: `extra-s-${index}`,
      level: 0,
      difficulty: built.difficulty,
      graded: false,
      kind: 'specificity',
      selector: built.selector,
      answer,
      prompt: 'Welke specificiteit heeft deze selector?',
      lesson: lessonFor(built.selector),
      explanation: `De engine komt uit op ${formatSpecificity(answer)}. Elk cijfer is een kolom, geen totaal.`,
    }
  }
  let a = battleSelector(rng)
  let b = battleSelector(rng)
  if (a === b) b = `${pick(rng, ELEMENTS)} .${pick(rng, CLASSES)}`
  const verdict = solveBattle(a, b)
  return {
    id: `extra-b-${index}`,
    level: 0,
    difficulty: 2,
    graded: false,
    kind: 'selector-battle',
    a,
    b,
    answer: verdict,
    prompt: 'Welke selector is specifieker?',
    lesson: 'Vergelijk de specificity waarden van links naar rechts. Het eerste verschil beslist.',
    explanation: `A is ${formatSpecificity(solveSpecificity(a))}. B is ${formatSpecificity(solveSpecificity(b))}.`,
  }
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
