import { compareSpecificity, type CascadeDeclaration, type Origin } from '../../types/specificity.ts'

function importanceRank(origin: Origin, important: boolean): number {
  if (important) {
    if (origin === 'author') return 5
    if (origin === 'user') return 6
    return 7
  }
  if (origin === 'ua') return 1
  if (origin === 'user') return 2
  return 3
}

function layerKey(declaration: CascadeDeclaration): number {
  if (declaration.important) {
    return declaration.layer ? -declaration.layer.order : Number.NEGATIVE_INFINITY
  }
  return declaration.layer ? declaration.layer.order : Number.POSITIVE_INFINITY
}

export function compareCascade(a: CascadeDeclaration, b: CascadeDeclaration): number {
  const importance = importanceRank(a.origin, a.important) - importanceRank(b.origin, b.important)
  if (importance !== 0) return importance > 0 ? 1 : -1
  const layerA = layerKey(a)
  const layerB = layerKey(b)
  if (layerA !== layerB) return layerA > layerB ? 1 : -1
  const specificity = compareSpecificity(a.specificity, b.specificity)
  if (specificity !== 0) return specificity
  if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder > b.sourceOrder ? 1 : -1
  return 0
}

export function winningDeclaration<T extends CascadeDeclaration>(declarations: T[]): T {
  if (declarations.length === 0) throw new Error('Geen declaraties')
  return declarations.reduce((best, item) => (compareCascade(item, best) > 0 ? item : best))
}
