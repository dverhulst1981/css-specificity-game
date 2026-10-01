import type { Difficulty, MatchNode, MatchQuestion } from '../../types/question.ts'

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

function ask(input: {
  id: string
  difficulty: Difficulty
  selector: string
  tree: MatchNode[]
  answer: string[]
  lesson: string
  explanation: string
  trap?: boolean
  trapLead?: string
}): MatchQuestion {
  return {
    kind: 'who-matches',
    graded: true,
    level: 1,
    prompt: 'Welke elementen raakt deze selector?',
    ...input,
  }
}

export const matchQuestions: MatchQuestion[] = [
  ask({
    id: 'sel-p',
    difficulty: 1,
    selector: 'p',
    lesson: 'Een elementselector raakt elk element met die tagnaam.',
    explanation: 'p raakt elk p-element. De titel is een h1, die blijft buiten.',
    tree: [
      node('p-art', 'article', {
        children: [
          node('p-h', 'h1', { text: 'Welkom' }),
          node('p-1', 'p', { text: 'Eerste alinea.' }),
          node('p-2', 'p', { text: 'Tweede alinea.' }),
        ],
      }),
    ],
    answer: ['p-1', 'p-2'],
  }),
  ask({
    id: 'sel-class',
    difficulty: 1,
    selector: '.note',
    lesson: 'Een punt gevolgd door een naam is een klasse.',
    explanation: '.note raakt alleen het element met die klasse. De andere alinea’s hebben ze niet.',
    tree: [
      node('c-sec', 'section', {
        children: [
          node('c-lead', 'p', { className: 'lead', text: 'Openingszin.' }),
          node('c-plain', 'p', { text: 'Gewone zin.' }),
          node('c-note', 'p', { className: 'note', text: 'Een tip.' }),
        ],
      }),
    ],
    answer: ['c-note'],
  }),
  ask({
    id: 'sel-id',
    difficulty: 1,
    selector: '#titel',
    lesson: 'Een hekje gevolgd door een naam is een id. Die hoort bij één element.',
    explanation: '#titel raakt de h1 met dat id. De ondertitel heeft een ander id.',
    tree: [
      node('i-head', 'header', {
        children: [
          node('i-title', 'h1', { idAttr: 'titel', text: 'Selector Wars' }),
          node('i-sub', 'p', { idAttr: 'ondertitel', text: 'Tel de cascade.' }),
        ],
      }),
    ],
    answer: ['i-title'],
  }),
  ask({
    id: 'sel-descendant',
    difficulty: 2,
    selector: 'article p',
    lesson: 'Een spatie betekent: ergens binnen, niet per se direct erin.',
    explanation:
      'article p raakt elke p binnen article, ook dieper in het aside. De p naast het artikel valt erbuiten.',
    tree: [
      node('d-main', 'main', {
        children: [
          node('d-art', 'article', {
            children: [
              node('d-in', 'p', { text: 'In het artikel.' }),
              node('d-aside', 'aside', {
                children: [node('d-frame', 'p', { text: 'In het kader.' })],
              }),
            ],
          }),
          node('d-out', 'p', { text: 'Na het artikel.' }),
        ],
      }),
    ],
    answer: ['d-in', 'd-frame'],
  }),
  ask({
    id: 'sel-child',
    difficulty: 2,
    selector: 'nav > a',
    lesson: 'Het teken > eist een direct kind. Een niveau dieper telt niet.',
    explanation: 'nav > a raakt alleen links die direct in nav staan. De link in de span zit een niveau dieper.',
    tree: [
      node('ch-nav', 'nav', {
        children: [
          node('ch-home', 'a', { attrs: [{ name: 'href', value: '/' }], text: 'Home' }),
          node('ch-pad', 'a', { attrs: [{ name: 'href', value: '/pad' }], text: 'Pad' }),
          node('ch-span', 'span', {
            children: [node('ch-more', 'a', { attrs: [{ name: 'href', value: '/meer' }], text: 'Meer' })],
          }),
        ],
      }),
    ],
    answer: ['ch-home', 'ch-pad'],
  }),
  ask({
    id: 'sel-nested-li',
    difficulty: 3,
    selector: 'ul > li',
    trap: true,
    trapLead: 'Het teken > kijkt bij elke ul, niet alleen bij de buitenste.',
    lesson: 'Elke ul in de brok heeft eigen directe kinderen.',
    explanation:
      'ul > li raakt elke li die direct in een ul staat. De binnenste li is een direct kind van de binnenste ul, dus die telt mee.',
    tree: [
      node('n-ul', 'ul', {
        children: [
          node('n-apple', 'li', { text: 'Appel' }),
          node('n-pear', 'li', {
            children: [
              node('n-inner', 'ul', {
                children: [node('n-conf', 'li', { text: 'Conference' })],
              }),
            ],
          }),
        ],
      }),
    ],
    answer: ['n-apple', 'n-pear', 'n-conf'],
  }),
  ask({
    id: 'sel-plus',
    difficulty: 2,
    selector: 'h2 + p',
    lesson: 'Een plus raakt het element dat meteen volgt, met dezelfde ouder.',
    explanation: 'h2 + p raakt alleen de p die direct na een h2 komt. De alinea erna heeft een p als vorige buur.',
    tree: [
      node('pl-art', 'article', {
        children: [
          node('pl-h', 'h2', { text: 'Deel een' }),
          node('pl-next', 'p', { text: 'Meteen na de titel.' }),
          node('pl-later', 'p', { text: 'Nog een alinea.' }),
        ],
      }),
    ],
    answer: ['pl-next'],
  }),
  ask({
    id: 'sel-tilde',
    difficulty: 2,
    selector: 'h2 ~ p',
    lesson: 'Een tilde raakt elke volgende broer of zus, ook als er iets tussen staat.',
    explanation: 'h2 ~ p raakt elke p na de h2 met dezelfde ouder. Beide alinea’s komen na de titel.',
    tree: [
      node('ti-art', 'article', {
        children: [
          node('ti-h', 'h2', { text: 'Deel een' }),
          node('ti-next', 'p', { text: 'Meteen na de titel.' }),
          node('ti-later', 'p', { text: 'Nog een alinea.' }),
        ],
      }),
    ],
    answer: ['ti-next', 'ti-later'],
  }),
  ask({
    id: 'sel-href',
    difficulty: 1,
    selector: 'a[href]',
    lesson: 'Een attribuut tussen vierkante haken moet op het element staan.',
    explanation: 'a[href] raakt elke link met een href. De a zonder dat attribuut blijft buiten.',
    tree: [
      node('h-p', 'p', {
        children: [
          node('h-pad', 'a', { attrs: [{ name: 'href', value: '/pad' }], text: 'Pad' }),
          node('h-bare', 'a', { text: 'Zonder doel' }),
          node('h-out', 'a', { attrs: [{ name: 'href', value: 'https://example.com' }], text: 'Buiten' }),
        ],
      }),
    ],
    answer: ['h-pad', 'h-out'],
  }),
  ask({
    id: 'sel-first',
    difficulty: 2,
    selector: 'li:first-child',
    lesson: ':first-child is het element dat op de eerste plek bij zijn ouder staat.',
    explanation: 'li:first-child raakt alleen de li die het eerste kind van zijn ouder is. Dat is Eerste.',
    tree: [
      node('f-ul', 'ul', {
        children: [
          node('f-1', 'li', { text: 'Eerste' }),
          node('f-2', 'li', { text: 'Tweede' }),
          node('f-3', 'li', { text: 'Derde' }),
        ],
      }),
    ],
    answer: ['f-1'],
  }),
  ask({
    id: 'sel-nth',
    difficulty: 2,
    selector: 'li:nth-child(2)',
    lesson: 'nth-child telt de kinderen van de ouder vanaf 1.',
    explanation: 'li:nth-child(2) is het tweede kind. In deze lijst is dat Tweede.',
    tree: [
      node('t-ul', 'ul', {
        children: [
          node('t-1', 'li', { text: 'Eerste' }),
          node('t-2', 'li', { text: 'Tweede' }),
          node('t-3', 'li', { text: 'Derde' }),
        ],
      }),
    ],
    answer: ['t-2'],
  }),
  ask({
    id: 'sel-not',
    difficulty: 2,
    selector: 'button:not(.skip)',
    lesson: ':not(.skip) haalt elementen met die klasse eruit.',
    explanation: 'button:not(.skip) raakt de knoppen zonder klasse skip. Annuleer heeft die klasse en valt weg.',
    tree: [
      node('no-bar', 'div', {
        children: [
          node('no-save', 'button', { className: 'btn', text: 'Bewaar' }),
          node('no-cancel', 'button', { className: 'btn skip', text: 'Annuleer' }),
          node('no-send', 'button', { className: 'btn', text: 'Verstuur' }),
        ],
      }),
    ],
    answer: ['no-save', 'no-send'],
  }),
  ask({
    id: 'sel-both',
    difficulty: 2,
    selector: 'a.btn.primary',
    lesson: 'Twee klassen achter elkaar moeten allebei op hetzelfde element staan.',
    explanation: 'a.btn.primary eist een a met beide klassen. Alleen btn of alleen primary is te weinig.',
    tree: [
      node('b-p', 'p', {
        children: [
          node('b-plain', 'a', { className: 'btn', text: 'Gewoon' }),
          node('b-go', 'a', { className: 'btn primary', text: 'Start' }),
          node('b-loose', 'a', { className: 'primary', text: 'Los' }),
        ],
      }),
    ],
    answer: ['b-go'],
  }),
  ask({
    id: 'sel-email',
    difficulty: 1,
    selector: 'input[type="email"]',
    lesson: 'type="email" eist die waarde, niet elk invoerveld.',
    explanation: 'input[type="email"] raakt alleen het e-mailveld. Het tekstveld en de knop vallen erbuiten.',
    tree: [
      node('e-form', 'form', {
        children: [
          node('e-text', 'input', { attrs: [{ name: 'type', value: 'text' }] }),
          node('e-mail', 'input', { attrs: [{ name: 'type', value: 'email' }] }),
          node('e-send', 'button', { text: 'Verstuur' }),
        ],
      }),
    ],
    answer: ['e-mail'],
  }),
  ask({
    id: 'sel-group',
    difficulty: 1,
    selector: 'h1, h2',
    lesson: 'Een komma is een lijst. Elk deel mag zelf iets raken.',
    explanation: 'h1, h2 raakt elke h1 en elke h2. De alinea is geen van beide.',
    tree: [
      node('g-art', 'article', {
        children: [
          node('g-h1', 'h1', { text: 'Titel' }),
          node('g-h2', 'h2', { text: 'Deel' }),
          node('g-p', 'p', { text: 'Tekst.' }),
        ],
      }),
    ],
    answer: ['g-h1', 'g-h2'],
  }),
  ask({
    id: 'sel-star',
    difficulty: 2,
    selector: '.card *',
    lesson: 'Een ster raakt elementen. De ster na een spatie raakt niet het element vóór de spatie.',
    explanation: '.card * raakt alles binnen de kaart. De kaart zelf niet, en de p erbuiten ook niet.',
    tree: [
      node('s-wrap', 'div', {
        children: [
          node('s-card', 'div', {
            className: 'card',
            children: [
              node('s-h', 'h2', { text: 'Kaart' }),
              node('s-p', 'p', { text: 'Uitleg.' }),
            ],
          }),
          node('s-out', 'p', { text: 'Erbuiten.' }),
        ],
      }),
    ],
    answer: ['s-h', 's-p'],
  }),
  ask({
    id: 'sel-hover',
    difficulty: 3,
    selector: 'a:hover',
    trap: true,
    trapLead: 'In stilstaande HTML staat de muis nergens op.',
    lesson: ':hover vraagt om een element waar de aanwijzer op staat.',
    explanation: 'a:hover raakt een link onder de muis. Deze brok is stil, dus de selector raakt niemand.',
    tree: [
      node('hv-p', 'p', {
        children: [
          node('hv-a', 'a', { className: 'nav', attrs: [{ name: 'href', value: '/pad' }], text: 'Pad' }),
          node('hv-btn', 'button', { className: 'nav', text: 'Menu' }),
        ],
      }),
    ],
    answer: [],
  }),
  ask({
    id: 'sel-before',
    difficulty: 3,
    selector: 'p.note::before',
    trap: true,
    trapLead: 'Een pseudo-element staat niet als element in de HTML.',
    lesson: '::before maakt iets dat de browser tekent, zonder een eigen tag in de bron.',
    explanation: 'p.note::before wijst naar een pseudo-element. Dat kun je in deze HTML niet aanduiden.',
    tree: [node('bf-p', 'p', { className: 'note', text: 'Tip' })],
    answer: [],
  }),
  ask({
    id: 'sel-first-child',
    difficulty: 3,
    selector: 'p:first-child',
    trap: true,
    trapLead: ':first-child kijkt naar de plek, niet naar het eerste element van dat type.',
    lesson: 'Het eerste kind van de section is geen p.',
    explanation:
      'p:first-child raakt een p die het eerste kind van zijn ouder is. Hier is dat eerste kind een h2, dus geen enkele p.',
    tree: [
      node('fc-sec', 'section', {
        children: [
          node('fc-h', 'h2', { text: 'Opdracht' }),
          node('fc-1', 'p', { text: 'Lees de selector.' }),
          node('fc-2', 'p', { text: 'Duid de elementen aan.' }),
        ],
      }),
    ],
    answer: [],
  }),
]
