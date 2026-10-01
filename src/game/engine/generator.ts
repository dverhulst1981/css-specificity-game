import type { MatchNode, Question } from '../../types/question.ts'
import { formatSpecificity } from '../../types/specificity.ts'
import { elementLabel } from './match.ts'
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

function nid(index: number, part: string): string {
  return `xm${index}-${part}`
}

function node(
  id: string,
  tag: string,
  options: {
    idAttr?: string
    className?: string
    attrs?: { name: string; value: string }[]
    text?: string
    children?: MatchNode[]
  } = {},
): MatchNode {
  return { id, tag, ...options }
}

const LINES = ['Welkom', 'De klas', 'Een tip', 'Start', 'Het pad', 'Menu', 'Eerste', 'Tweede', 'Derde', 'De kaart']

function line(rng: () => number, salt: number): string {
  return LINES[(Math.floor(rng() * LINES.length) + salt) % LINES.length]!
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = copy[index]!
    copy[index] = copy[swap]!
    copy[swap] = current
  }
  return copy
}

function twoNames(rng: () => number): [string, string] {
  const first = pick(rng, CLASSES)
  const rest = CLASSES.filter((name) => name !== first)
  return [first, pick(rng, rest)]
}

type BuiltMatch = {
  selector: string
  tree: MatchNode[]
  answer: string[]
  difficulty: 1 | 2 | 3
  lesson: string
  because: string
}

function matchElement(rng: () => number, index: number): BuiltMatch {
  const tags = ['p', 'span', 'a', 'strong', 'em', 'h2']
  const target = pick(rng, tags)
  const others = tags.filter((tag) => tag !== target)
  const flags = shuffle(rng, [true, true, false, false])
  const children = flags.map((hit, slot) => {
    const id = nid(index, `el${slot}`)
    const tag = hit ? target : pick(rng, others)
    return node(id, tag, { text: line(rng, slot) })
  })
  return {
    selector: target,
    tree: [node(nid(index, 'wrap'), pick(rng, ['section', 'article', 'main']), { children })],
    answer: children.filter((child) => child.tag === target).map((child) => child.id),
    difficulty: 1,
    lesson: 'Een tagnaam raakt elk element met die naam.',
    because: 'Een tagnaam raakt elk element met die naam.',
  }
}

function matchClass(rng: () => number, index: number): BuiltMatch {
  const name = pick(rng, CLASSES)
  const other = CLASSES.find((item) => item !== name) ?? 'note'
  const slots = shuffle(rng, [name, other, '', name])
  const children = slots.map((className, slot) =>
    node(nid(index, `cl${slot}`), slot === 3 ? 'span' : 'p', {
      className: className || undefined,
      text: line(rng, slot),
    }),
  )
  return {
    selector: `.${name}`,
    tree: [node(nid(index, 'wrap'), 'section', { children })],
    answer: children.filter((child) => child.className === name).map((child) => child.id),
    difficulty: 1,
    lesson: 'Een punt gevolgd door een naam is een klasse.',
    because: 'Alleen elementen met die klasse doen mee.',
  }
}

function matchId(rng: () => number, index: number): BuiltMatch {
  const name = pick(rng, IDS)
  const children = [
    node(nid(index, 'hit'), 'h1', { idAttr: name, text: line(rng, 0) }),
    node(nid(index, 'miss'), 'p', { idAttr: pick(rng, IDS.filter((item) => item !== name)), text: line(rng, 1) }),
  ]
  return {
    selector: `#${name}`,
    tree: [node(nid(index, 'wrap'), 'header', { children })],
    answer: [children[0]!.id],
    difficulty: 1,
    lesson: 'Een hekje gevolgd door een naam is een id.',
    because: 'Een id hoort bij één element.',
  }
}

function matchDescendant(rng: () => number, index: number): BuiltMatch {
  const container = pick(rng, ['article', 'section', 'nav'])
  const inner = pick(rng, ['p', 'span', 'a', 'strong'])
  const inside = node(nid(index, 'in'), inner, { text: line(rng, 0) })
  const deep = node(nid(index, 'deep'), inner, { text: line(rng, 1) })
  const outside = node(nid(index, 'out'), inner, { text: line(rng, 2) })
  return {
    selector: `${container} ${inner}`,
    tree: [
      node(nid(index, 'main'), 'main', {
        children: [
          node(nid(index, 'box'), container, {
            children: [inside, node(nid(index, 'aside'), 'aside', { children: [deep] })],
          }),
          outside,
        ],
      }),
    ],
    answer: [inside.id, deep.id],
    difficulty: 2,
    lesson: 'Een spatie betekent: ergens binnen, niet per se direct erin.',
    because: 'De spatie kijkt overal binnen het eerste element, ook een niveau dieper.',
  }
}

function matchChild(rng: () => number, index: number): BuiltMatch {
  const parent = pick(rng, ['nav', 'div', 'section'])
  const child = pick(rng, ['a', 'span', 'strong'])
  const bridge = child === 'span' ? 'em' : 'span'
  const home = node(nid(index, 'a'), child, { text: line(rng, 0) })
  const pad = node(nid(index, 'b'), child, { text: line(rng, 1) })
  const deep = node(nid(index, 'c'), child, { text: line(rng, 2) })
  return {
    selector: `${parent} > ${child}`,
    tree: [
      node(nid(index, 'parent'), parent, {
        children: [home, pad, node(nid(index, 'bridge'), bridge, { children: [deep] })],
      }),
    ],
    answer: [home.id, pad.id],
    difficulty: 2,
    lesson: 'Het teken > eist een direct kind.',
    because: 'Alleen directe kinderen tellen. Een niveau dieper valt buiten.',
  }
}

function matchPlus(rng: () => number, index: number): BuiltMatch {
  const next = node(nid(index, 'next'), 'p', { text: line(rng, 1) })
  return {
    selector: 'h2 + p',
    tree: [
      node(nid(index, 'art'), 'article', {
        children: [
          node(nid(index, 'h'), 'h2', { text: line(rng, 0) }),
          next,
          node(nid(index, 'later'), 'p', { text: line(rng, 2) }),
        ],
      }),
    ],
    answer: [next.id],
    difficulty: 2,
    lesson: 'Een plus raakt het element dat meteen volgt.',
    because: 'Alleen de p die direct na de h2 komt, telt mee.',
  }
}

function matchTilde(rng: () => number, index: number): BuiltMatch {
  const first = node(nid(index, 'a'), 'p', { text: line(rng, 1) })
  const second = node(nid(index, 'b'), 'p', { text: line(rng, 2) })
  return {
    selector: 'h2 ~ p',
    tree: [
      node(nid(index, 'art'), 'article', {
        children: [
          node(nid(index, 'before'), 'p', { text: line(rng, 0) }),
          node(nid(index, 'h'), 'h2', { text: line(rng, 3) }),
          first,
          node(nid(index, 'mid'), 'span', { text: line(rng, 4) }),
          second,
        ],
      }),
    ],
    answer: [first.id, second.id],
    difficulty: 2,
    lesson: 'Een tilde raakt elke volgende broer of zus.',
    because: 'Elke p na de h2, met dezelfde ouder, telt mee. Wat ervoor staat niet.',
  }
}

function matchAttr(rng: () => number, index: number): BuiltMatch {
  const pad = node(nid(index, 'pad'), 'a', { attrs: [{ name: 'href', value: '/pad' }], text: line(rng, 0) })
  const bare = node(nid(index, 'bare'), 'a', { text: line(rng, 1) })
  const out = node(nid(index, 'out'), 'a', { attrs: [{ name: 'href', value: 'https://example.com' }], text: line(rng, 2) })
  return {
    selector: 'a[href]',
    tree: [node(nid(index, 'p'), 'p', { children: [pad, bare, out] })],
    answer: [pad.id, out.id],
    difficulty: 1,
    lesson: 'Een attribuut tussen vierkante haken moet op het element staan.',
    because: 'Alleen links met een href doen mee.',
  }
}

function matchFirst(rng: () => number, index: number): BuiltMatch {
  const items = [0, 1, 2].map((slot) => node(nid(index, `li${slot}`), 'li', { text: line(rng, slot) }))
  return {
    selector: 'li:first-child',
    tree: [node(nid(index, 'ul'), 'ul', { children: items })],
    answer: [items[0]!.id],
    difficulty: 2,
    lesson: ':first-child is het element op de eerste plek bij zijn ouder.',
    because: 'Alleen het eerste kind van de lijst is een li:first-child.',
  }
}

function matchFirstMiss(rng: () => number, index: number): BuiltMatch {
  return {
    selector: 'p:first-child',
    tree: [
      node(nid(index, 'sec'), 'section', {
        children: [
          node(nid(index, 'h'), 'h2', { text: line(rng, 0) }),
          node(nid(index, 'a'), 'p', { text: line(rng, 1) }),
          node(nid(index, 'b'), 'p', { text: line(rng, 2) }),
        ],
      }),
    ],
    answer: [],
    difficulty: 3,
    lesson: ':first-child kijkt naar de plek, niet naar het eerste element van dat type.',
    because: 'Het eerste kind is een h2, dus geen enkele p is first-child.',
  }
}

function matchNot(rng: () => number, index: number): BuiltMatch {
  const save = node(nid(index, 'save'), 'button', { className: 'btn', text: line(rng, 0) })
  const cancel = node(nid(index, 'cancel'), 'button', { className: 'btn skip', text: line(rng, 1) })
  const send = node(nid(index, 'send'), 'button', { className: 'btn', text: line(rng, 2) })
  return {
    selector: 'button:not(.skip)',
    tree: [node(nid(index, 'bar'), 'div', { children: [save, cancel, send] })],
    answer: [save.id, send.id],
    difficulty: 2,
    lesson: ':not(.skip) haalt elementen met die klasse eruit.',
    because: 'De knop met klasse skip valt weg.',
  }
}

function matchBoth(rng: () => number, index: number): BuiltMatch {
  const [left, right] = twoNames(rng)
  const plain = node(nid(index, 'plain'), 'a', { className: left, text: line(rng, 0) })
  const both = node(nid(index, 'both'), 'a', { className: `${left} ${right}`, text: line(rng, 1) })
  const loose = node(nid(index, 'loose'), 'a', { className: right, text: line(rng, 2) })
  return {
    selector: `a.${left}.${right}`,
    tree: [node(nid(index, 'p'), 'p', { children: [plain, both, loose] })],
    answer: [both.id],
    difficulty: 2,
    lesson: 'Twee klassen achter elkaar moeten allebei op hetzelfde element staan.',
    because: 'Eén van de twee klassen is te weinig.',
  }
}

function matchGroup(rng: () => number, index: number): BuiltMatch {
  const heading = node(nid(index, 'h1'), 'h1', { text: line(rng, 0) })
  const sub = node(nid(index, 'h2'), 'h2', { text: line(rng, 1) })
  return {
    selector: 'h1, h2',
    tree: [
      node(nid(index, 'art'), 'article', {
        children: [heading, sub, node(nid(index, 'p'), 'p', { text: line(rng, 2) })],
      }),
    ],
    answer: [heading.id, sub.id],
    difficulty: 1,
    lesson: 'Een komma is een lijst. Elk deel mag zelf iets raken.',
    because: 'Elke h1 en elke h2 telt mee.',
  }
}

function matchStar(rng: () => number, index: number): BuiltMatch {
  const name = pick(rng, CLASSES)
  const title = node(nid(index, 'h'), 'h2', { text: line(rng, 0) })
  const copy = node(nid(index, 'p'), 'p', { text: line(rng, 1) })
  return {
    selector: `.${name} *`,
    tree: [
      node(nid(index, 'wrap'), 'div', {
        children: [
          node(nid(index, 'card'), 'div', { className: name, children: [title, copy] }),
          node(nid(index, 'out'), 'p', { text: line(rng, 2) }),
        ],
      }),
    ],
    answer: [title.id, copy.id],
    difficulty: 2,
    lesson: 'Een ster na een spatie raakt de elementen erin, niet het element zelf.',
    because: 'Alles binnen de klasse telt mee. De klasse zelf en wat erbuiten staat niet.',
  }
}

function matchHover(rng: () => number, index: number): BuiltMatch {
  return {
    selector: 'a:hover',
    tree: [
      node(nid(index, 'p'), 'p', {
        children: [
          node(nid(index, 'a'), 'a', { attrs: [{ name: 'href', value: '/pad' }], text: line(rng, 0) }),
          node(nid(index, 'btn'), 'button', { text: line(rng, 1) }),
        ],
      }),
    ],
    answer: [],
    difficulty: 3,
    lesson: ':hover vraagt om een element waar de aanwijzer op staat.',
    because: 'In stilstaande HTML staat de muis nergens op.',
  }
}

function matchBefore(rng: () => number, index: number): BuiltMatch {
  const name = pick(rng, CLASSES)
  return {
    selector: `p.${name}::before`,
    tree: [node(nid(index, 'p'), 'p', { className: name, text: line(rng, 0) })],
    answer: [],
    difficulty: 3,
    lesson: '::before maakt een pseudo-element. Dat staat niet als tag in de HTML.',
    because: 'Een pseudo-element kun je in deze HTML niet aanduiden.',
  }
}

function matchNested(rng: () => number, index: number): BuiltMatch {
  const apple = node(nid(index, 'apple'), 'li', { text: line(rng, 0) })
  const pear = node(nid(index, 'pear'), 'li', {
    children: [node(nid(index, 'inner'), 'ul', { children: [node(nid(index, 'conf'), 'li', { text: line(rng, 1) })] })],
  })
  const inner = pear.children![0]!.children![0]!
  return {
    selector: 'ul > li',
    tree: [node(nid(index, 'ul'), 'ul', { children: [apple, pear] })],
    answer: [apple.id, pear.id, inner.id],
    difficulty: 3,
    lesson: 'Het teken > kijkt bij elke ul, niet alleen bij de buitenste.',
    because: 'De binnenste li is een direct kind van de binnenste ul.',
  }
}

const MATCH_BUILDERS = [
  matchElement,
  matchClass,
  matchId,
  matchDescendant,
  matchChild,
  matchPlus,
  matchTilde,
  matchAttr,
  matchFirst,
  matchFirstMiss,
  matchNot,
  matchBoth,
  matchGroup,
  matchStar,
  matchHover,
  matchBefore,
  matchNested,
]

function generateMatch(rng: () => number, index: number): Question {
  const built = pick(rng, MATCH_BUILDERS)(rng, index)
  const hit =
    built.answer.length === 0
      ? 'geen enkel element'
      : built.answer.map((id) => elementLabel(built.tree, id)).join(', ')
  return {
    id: `extra-m-${index}`,
    level: 0,
    difficulty: built.difficulty,
    graded: false,
    kind: 'who-matches',
    selector: built.selector,
    tree: built.tree,
    answer: built.answer,
    prompt: 'Welke elementen raakt deze selector?',
    lesson: built.lesson,
    explanation: `${built.because} Deze selector raakt ${hit}.`,
  }
}

export function generateQuestion(rng: () => number, index: number): Question {
  const kindRoll = rng()
  if (kindRoll < 0.34) return generateMatch(rng, index)
  if (kindRoll < 0.67) {
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
