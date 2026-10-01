import { describe, expect, it } from 'vitest'
import { spec, type CascadeDeclaration } from '../../types/specificity.ts'
import { compareCascade, winningDeclaration } from './cascade.ts'

function decl(partial: Partial<CascadeDeclaration> & Pick<CascadeDeclaration, 'id'>): CascadeDeclaration {
  return {
    id: partial.id,
    origin: partial.origin ?? 'author',
    important: partial.important ?? false,
    layer: partial.layer ?? null,
    specificity: partial.specificity ?? spec(0, 0, 0, 0),
    sourceOrder: partial.sourceOrder ?? 0,
  }
}

describe('cascade compare', () => {
  it('lets a later rule win when specificity ties', () => {
    const winner = winningDeclaration([
      decl({ id: 'first', specificity: spec(0, 0, 1, 0), sourceOrder: 0 }),
      decl({ id: 'second', specificity: spec(0, 0, 1, 0), sourceOrder: 1 }),
    ])
    expect(winner.id).toBe('second')
  })

  it('lets author importance beat a more specific normal rule', () => {
    const winner = winningDeclaration([
      decl({ id: 'important', important: true, specificity: spec(0, 0, 0, 1), sourceOrder: 0 }),
      decl({ id: 'id', specificity: spec(0, 1, 0, 0), sourceOrder: 1 }),
    ])
    expect(winner.id).toBe('important')
  })

  it('orders origins even though MVP questions stay on author', () => {
    expect(
      compareCascade(decl({ id: 'author' }), decl({ id: 'user', origin: 'user' })),
    ).toBe(1)
    expect(
      compareCascade(
        decl({ id: 'author-important', important: true }),
        decl({ id: 'user-important', origin: 'user', important: true }),
      ),
    ).toBe(-1)
  })

  it('uses layer order and reverses it for important declarations', () => {
    const normal = winningDeclaration([
      decl({ id: 'early', layer: { order: 0 }, specificity: spec(0, 0, 1, 0) }),
      decl({ id: 'late', layer: { order: 1 }, specificity: spec(0, 0, 1, 0) }),
    ])
    expect(normal.id).toBe('late')
    const important = winningDeclaration([
      decl({ id: 'early', important: true, layer: { order: 0 }, specificity: spec(0, 0, 1, 0) }),
      decl({ id: 'late', important: true, layer: { order: 1 }, specificity: spec(0, 0, 1, 0) }),
    ])
    expect(important.id).toBe('early')
  })
})
