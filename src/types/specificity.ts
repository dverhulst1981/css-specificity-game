export type Specificity = {
  inline: number
  ids: number
  classes: number
  elements: number
}

export type Origin = 'ua' | 'user' | 'author'

export type CascadeLayer = {
  order: number
  name?: string
} | null

export type CascadeDeclaration = {
  id: string
  origin: Origin
  important: boolean
  layer: CascadeLayer
  specificity: Specificity
  sourceOrder: number
}

export const ZERO: Specificity = { inline: 0, ids: 0, classes: 0, elements: 0 }

export function spec(
  inline: number,
  ids: number,
  classes: number,
  elements: number,
): Specificity {
  return { inline, ids, classes, elements }
}

export function addSpec(a: Specificity, b: Specificity): Specificity {
  return {
    inline: a.inline + b.inline,
    ids: a.ids + b.ids,
    classes: a.classes + b.classes,
    elements: a.elements + b.elements,
  }
}

export function compareSpecificity(a: Specificity, b: Specificity): number {
  if (a.inline !== b.inline) return a.inline > b.inline ? 1 : -1
  if (a.ids !== b.ids) return a.ids > b.ids ? 1 : -1
  if (a.classes !== b.classes) return a.classes > b.classes ? 1 : -1
  if (a.elements !== b.elements) return a.elements > b.elements ? 1 : -1
  return 0
}

export function maxSpec(items: Specificity[]): Specificity {
  if (items.length === 0) {
    throw new Error('Geen specificiteit om te vergelijken')
  }
  return items.reduce((best, item) => (compareSpecificity(item, best) > 0 ? item : best))
}

export function formatSpecificity(value: Specificity): string {
  return `${value.inline}-${value.ids}-${value.classes}-${value.elements}`
}

export function sameSpec(a: Specificity, b: Specificity): boolean {
  return compareSpecificity(a, b) === 0
}
