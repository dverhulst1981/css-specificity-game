import { describe, expect, it } from 'vitest'
import { addSpec, compareSpecificity, formatSpecificity, spec } from '../../types/specificity.ts'
import { inspectSelector, specificityOf } from './parse.ts'

const cases: Array<[string, ReturnType<typeof spec>]> = [
  ['p', spec(0, 0, 0, 1)],
  ['.title', spec(0, 0, 1, 0)],
  ['#app', spec(0, 1, 0, 0)],
  ['.card .title', spec(0, 0, 2, 0)],
  ['#app .card', spec(0, 1, 1, 0)],
  ['button:hover', spec(0, 0, 1, 1)],
  ['input[type="text"]', spec(0, 0, 1, 1)],
  ['p::before', spec(0, 0, 0, 2)],
  [':not(.active)', spec(0, 0, 1, 0)],
  [':is(#app, .container)', spec(0, 1, 0, 0)],
  [':where(#app, .container)', spec(0, 0, 0, 0)],
  [':has(.title)', spec(0, 0, 1, 0)],
  [':has(#app, .title)', spec(0, 1, 0, 0)],
  [':nth-child(n of .item)', spec(0, 0, 2, 0)],
  [':nth-child(2n+1 of #app .card)', spec(0, 1, 2, 0)],
  [':nth-last-child(1 of .card)', spec(0, 0, 2, 0)],
  ['*', spec(0, 0, 0, 0)],
  ['div > p', spec(0, 0, 0, 2)],
  ['.btn.primary', spec(0, 0, 2, 0)],
  ['a:hover::before', spec(0, 0, 1, 2)],
  [':where(.card) .title', spec(0, 0, 1, 0)],
  ['section:has(#app .card)', spec(0, 1, 1, 1)],
  ['li:nth-child(odd of #list .row)', spec(0, 1, 2, 1)],
  [':not(:where(#app))', spec(0, 0, 0, 0)],
  [':is(:where(#app), .a)', spec(0, 0, 1, 0)],
]

describe('specificity parser', () => {
  it.each(cases)('%s → %s', (selector, expected) => {
    const inspected = inspectSelector(selector)
    expect(inspected.specificity).toEqual(expected)
    expect(formatSpecificity(inspected.specificity)).toBe(formatSpecificity(expected))
    const summed = inspected.tokens.map((token) => token.specificity).reduce(addSpec, spec(0, 0, 0, 0))
    expect(summed).toEqual(expected)
    expect(inspected.tokens.map((token) => token.text).join('')).toBe(selector)
  })

  it('compares lexicographically and never as a weighted sum', () => {
    expect(compareSpecificity(spec(0, 1, 0, 0), spec(0, 0, 10, 0))).toBe(1)
    expect(compareSpecificity(spec(0, 0, 1, 0), spec(0, 0, 0, 10))).toBe(1)
    expect(compareSpecificity(spec(1, 0, 0, 0), spec(0, 10, 0, 0))).toBe(1)
    expect(compareSpecificity(specificityOf('#app'), specificityOf('.card .title .btn'))).toBe(1)
  })
})
