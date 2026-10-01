import {
  addSpec,
  maxSpec,
  spec,
  ZERO,
  type Specificity,
} from '../../types/specificity.ts'

export type Token = {
  text: string
  specificity: Specificity
}

export class SelectorSyntaxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SelectorSyntaxError'
  }
}

const ONE_CLASS = spec(0, 0, 1, 0)
const ONE_ELEMENT = spec(0, 0, 0, 1)
const ONE_ID = spec(0, 1, 0, 0)

const LEGACY_ELEMENTS = new Set(['before', 'after', 'first-line', 'first-letter'])
const ARGUMENT_MAX = new Set(['is', 'not', 'has', 'matches'])
const NTH = new Set(['nth-child', 'nth-last-child'])

export function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = []
  let start = 0
  let depth = 0
  let quote: '"' | "'" | null = null
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (quote) {
      if (char === '\\') {
        i += 1
        continue
      }
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '(' || char === '[') depth += 1
    else if (char === ')' || char === ']') depth = Math.max(0, depth - 1)
    else if (char === ',' && depth === 0) {
      parts.push(input.slice(start, i).trim())
      start = i + 1
    }
  }
  const last = input.slice(start).trim()
  if (last) parts.push(last)
  return parts
}

function splitNth(arg: string): { micro: string; ofList: string | null } {
  let depth = 0
  let quote: '"' | "'" | null = null
  for (let i = 0; i < arg.length; i++) {
    const char = arg[i]
    if (quote) {
      if (char === '\\') {
        i += 1
        continue
      }
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '(' || char === '[') {
      depth += 1
      continue
    }
    if (char === ')' || char === ']') {
      depth -= 1
      continue
    }
    if (depth !== 0 || !isWs(char)) continue
    let j = i
    while (j < arg.length && isWs(arg[j])) j += 1
    if (arg.slice(j, j + 2).toLowerCase() !== 'of') continue
    const afterOf = j + 2
    if (afterOf < arg.length && isWs(arg[afterOf])) {
      return { micro: arg.slice(0, i).trim(), ofList: arg.slice(afterOf).trim() }
    }
  }
  return { micro: arg.trim(), ofList: null }
}

function isNthMicro(value: string): boolean {
  const compact = value.replace(/\s+/g, '')
  return /^(odd|even|[+-]?\d*n([+-]\d+)?|[+-]?\d+)$/i.test(compact)
}

export function specificityOf(selector: string): Specificity {
  return inspectSelector(selector).specificity
}

export function inspectSelector(selector: string): { specificity: Specificity; tokens: Token[] } {
  const parser = new Parser(selector.trim())
  if (parser.eof()) throw new SelectorSyntaxError('Lege selector')
  const specificity = parser.parseComplex()
  parser.skipWsAndComments()
  if (!parser.eof()) {
    throw new SelectorSyntaxError(`Onverwachte tekens bij “${parser.rest()}”`)
  }
  return { specificity, tokens: parser.tokens }
}

function specificityOfMax(selectorList: string): Specificity {
  const parts = splitTopLevelCommas(selectorList)
  if (parts.length === 0) throw new SelectorSyntaxError('Lege selectorlijst')
  return maxSpec(parts.map((part) => specificityOf(part)))
}

class Parser {
  readonly tokens: Token[] = []
  i = 0
  private readonly s: string

  constructor(source: string) {
    this.s = source
  }

  eof(): boolean {
    return this.i >= this.s.length
  }

  rest(): string {
    return this.s.slice(this.i, this.i + 24)
  }

  parseComplex(): Specificity {
    let total = this.parseCompound()
    for (;;) {
      if (!this.tryCombinator()) break
      total = addSpec(total, this.parseCompound())
    }
    return total
  }

  private parseCompound(): Specificity {
    this.skipComments()
    if (!this.hasSimple()) throw new SelectorSyntaxError('Selector verwacht')
    let total = ZERO
    while (this.hasSimple()) {
      total = addSpec(total, this.parseSimple())
    }
    return total
  }

  private parseSimple(): Specificity {
    this.skipComments()
    const char = this.s[this.i]
    if (char === '*') return this.parseUniversalOrNamespace()
    if (char === '#') return this.parseId()
    if (char === '.') return this.parseClass()
    if (char === '[') return this.parseAttribute()
    if (char === ':') return this.parsePseudo()
    return this.parseType()
  }

  private parseUniversalOrNamespace(): Specificity {
    const start = this.i
    this.i += 1
    if (this.s[this.i] === '|') {
      this.i += 1
      if (this.s[this.i] === '*') {
        this.i += 1
        this.push(start, ZERO)
        return ZERO
      }
      this.readIdent()
      this.push(start, ONE_ELEMENT)
      return ONE_ELEMENT
    }
    this.push(start, ZERO)
    return ZERO
  }

  private parseType(): Specificity {
    const start = this.i
    this.readIdent()
    if (this.s[this.i] === '|') {
      this.i += 1
      if (this.s[this.i] === '*') this.i += 1
      else this.readIdent()
      const text = this.s.slice(start, this.i)
      const value = text.endsWith('|*') ? ZERO : ONE_ELEMENT
      this.tokens.push({ text, specificity: value })
      return value
    }
    this.push(start, ONE_ELEMENT)
    return ONE_ELEMENT
  }

  private parseId(): Specificity {
    const start = this.i
    this.i += 1
    this.readName()
    this.push(start, ONE_ID)
    return ONE_ID
  }

  private parseClass(): Specificity {
    const start = this.i
    this.i += 1
    this.readName()
    this.push(start, ONE_CLASS)
    return ONE_CLASS
  }

  private parseAttribute(): Specificity {
    const start = this.i
    this.i += 1
    let depth = 1
    let quote: '"' | "'" | null = null
    while (this.i < this.s.length && depth > 0) {
      const char = this.s[this.i]
      if (quote) {
        if (char === '\\') {
          this.i += 2
          continue
        }
        if (char === quote) quote = null
        this.i += 1
        continue
      }
      if (char === '"' || char === "'") {
        quote = char
        this.i += 1
        continue
      }
      if (char === '[') depth += 1
      if (char === ']') depth -= 1
      this.i += 1
    }
    if (depth !== 0) throw new SelectorSyntaxError('Attribuut niet gesloten')
    this.push(start, ONE_CLASS)
    return ONE_CLASS
  }

  private parsePseudo(): Specificity {
    const start = this.i
    this.i += 1
    let element = false
    if (this.s[this.i] === ':') {
      element = true
      this.i += 1
    }
    const name = this.readIdent().toLowerCase()
    const legacy = !element && LEGACY_ELEMENTS.has(name)
    const isElement = element || legacy
    if (this.s[this.i] !== '(') {
      const value = isElement ? ONE_ELEMENT : ONE_CLASS
      this.push(start, value)
      return value
    }
    const inner = this.readBalanced()
    const value = this.pseudoValue(name, inner, isElement)
    this.push(start, value)
    return value
  }

  private pseudoValue(name: string, inner: string, isElement: boolean): Specificity {
    if (ARGUMENT_MAX.has(name)) {
      if (isElement) throw new SelectorSyntaxError(`::${name} is geen functie-pseudo-element`)
      return specificityOfMax(inner)
    }
    if (name === 'where') {
      if (inner.trim()) specificityOfMax(inner)
      return ZERO
    }
    if (NTH.has(name)) {
      const { micro, ofList } = splitNth(inner)
      if (!isNthMicro(micro)) {
        throw new SelectorSyntaxError(`Ongeldige An+B in :${name}()`)
      }
      const extra = ofList ? specificityOfMax(ofList) : ZERO
      return addSpec(ONE_CLASS, extra)
    }
    if (name === 'host' || name === 'host-context') {
      return inner.trim() ? addSpec(ONE_CLASS, specificityOfMax(inner)) : ONE_CLASS
    }
    if (name === 'slotted') {
      return addSpec(ONE_ELEMENT, specificityOfMax(inner))
    }
    return isElement ? ONE_ELEMENT : ONE_CLASS
  }

  private tryCombinator(): boolean {
    const start = this.i
    this.skipComments()
    let i = this.i
    while (i < this.s.length && isWs(this.s[i])) i += 1
    if (this.s.startsWith('||', i)) {
      i += 2
      while (i < this.s.length && isWs(this.s[i])) i += 1
      this.tokens.push({ text: this.s.slice(start, i), specificity: ZERO })
      this.i = i
      return true
    }
    const symbol = this.s[i]
    if (symbol && '>+~'.includes(symbol)) {
      i += 1
      while (i < this.s.length && isWs(this.s[i])) i += 1
      this.tokens.push({ text: this.s.slice(start, i), specificity: ZERO })
      this.i = i
      return true
    }
    if (i > this.i && this.peekSimple(i)) {
      this.tokens.push({ text: this.s.slice(start, i), specificity: ZERO })
      this.i = i
      return true
    }
    this.i = start
    return false
  }

  private readBalanced(): string {
    if (this.s[this.i] !== '(') throw new SelectorSyntaxError('Haakje verwacht')
    this.i += 1
    const start = this.i
    let depth = 1
    let quote: '"' | "'" | null = null
    while (this.i < this.s.length && depth > 0) {
      const char = this.s[this.i]
      if (quote) {
        if (char === '\\') {
          this.i += 2
          continue
        }
        if (char === quote) quote = null
        this.i += 1
        continue
      }
      if (char === '"' || char === "'") {
        quote = char
        this.i += 1
        continue
      }
      if (char === '(') depth += 1
      if (char === ')') depth -= 1
      if (depth === 0) break
      this.i += 1
    }
    if (depth !== 0) throw new SelectorSyntaxError('Haakje niet gesloten')
    const inner = this.s.slice(start, this.i)
    this.i += 1
    return inner
  }

  private readIdent(): string {
    const start = this.i
    const char = this.s[this.i]
    if (char === '\\') this.consumeEscape()
    else if (isIdentStart(char) || (char === '-' && this.canStartIdent(this.i))) this.i += 1
    else throw new SelectorSyntaxError('Naam verwacht')
    this.readNameBody()
    if (this.i === start) throw new SelectorSyntaxError('Lege naam')
    return this.s.slice(start, this.i)
  }

  private readName(): void {
    const start = this.i
    this.readNameBody()
    if (this.i === start) throw new SelectorSyntaxError('Naam verwacht')
  }

  private readNameBody(): void {
    while (this.i < this.s.length) {
      const char = this.s[this.i]
      if (char === '\\') {
        this.consumeEscape()
        continue
      }
      if (isNameChar(char)) {
        this.i += 1
        continue
      }
      break
    }
  }

  private consumeEscape(): void {
    this.i += 1
    if (this.i < this.s.length) this.i += 1
  }

  private canStartIdent(index: number): boolean {
    const next = this.s[index + 1]
    return isIdentStart(next) || next === '\\' || next === '-'
  }

  private hasSimple(): boolean {
    this.skipComments()
    return this.peekSimple(this.i)
  }

  private peekSimple(index: number): boolean {
    const char = this.s[index]
    if (!char) return false
    if ('#.[:*'.includes(char) || char === '\\') return true
    if (isIdentStart(char)) return true
    if (char === '-' && this.canStartIdent(index)) return true
    return false
  }

  skipWsAndComments(): void {
    for (;;) {
      const before = this.i
      while (this.i < this.s.length && isWs(this.s[this.i])) this.i += 1
      this.skipComments()
      if (this.i === before) break
    }
  }

  private skipComments(): void {
    while (this.s.startsWith('/*', this.i)) {
      const end = this.s.indexOf('*/', this.i + 2)
      if (end === -1) throw new SelectorSyntaxError('Commentaar niet gesloten')
      this.i = end + 2
    }
  }

  private push(start: number, specificity: Specificity): void {
    this.tokens.push({ text: this.s.slice(start, this.i), specificity })
  }
}

function isWs(char: string | undefined): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r' || char === '\f'
}

function isIdentStart(char: string | undefined): boolean {
  if (!char) return false
  return /[A-Za-z_]/.test(char) || char.charCodeAt(0) > 127
}

function isNameChar(char: string | undefined): boolean {
  if (!char) return false
  return /[A-Za-z0-9_-]/.test(char) || char.charCodeAt(0) > 127
}
