import type { MatchNode, MatchQuestion } from '../../types/question.ts'

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

export type HtmlLine = {
  pickId: string | null
  depth: number
  source: string
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function attrList(node: MatchNode, pick: boolean): string[] {
  const attrs: string[] = []
  if (pick) attrs.push(`data-pick="${escapeAttr(node.id)}"`)
  if (node.idAttr) attrs.push(`id="${escapeAttr(node.idAttr)}"`)
  if (node.className) attrs.push(`class="${escapeAttr(node.className)}"`)
  for (const attr of node.attrs ?? []) {
    attrs.push(`${attr.name}="${escapeAttr(attr.value)}"`)
  }
  return attrs
}

function openingTag(node: MatchNode, pick: boolean): string {
  const attrs = attrList(node, pick)
  return `<${node.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`
}

function serializeNode(node: MatchNode): string {
  const open = openingTag(node, true)
  if (VOID.has(node.tag)) return open
  const inner = `${escapeText(node.text ?? '')}${serializeTree(node.children ?? [])}`
  return `${open}${inner}</${node.tag}>`
}

export function serializeTree(nodes: MatchNode[]): string {
  return nodes.map((node) => serializeNode(node)).join('')
}

export function htmlLines(nodes: MatchNode[]): HtmlLine[] {
  const lines: HtmlLine[] = []
  function walk(list: MatchNode[], depth: number) {
    for (const node of list) {
      const children = node.children ?? []
      const open = openingTag(node, false)
      if (VOID.has(node.tag) || children.length === 0) {
        const close = VOID.has(node.tag) ? '' : `</${node.tag}>`
        lines.push({ pickId: node.id, depth, source: `${open}${node.text ?? ''}${close}` })
        continue
      }
      lines.push({ pickId: node.id, depth, source: open })
      walk(children, depth + 1)
      lines.push({ pickId: null, depth, source: `</${node.tag}>` })
    }
  }
  walk(nodes, 0)
  return lines
}

export function collectIds(nodes: MatchNode[]): string[] {
  const ids: string[] = []
  function walk(list: MatchNode[]) {
    for (const node of list) {
      ids.push(node.id)
      walk(node.children ?? [])
    }
  }
  walk(nodes)
  return ids
}

export function findNode(nodes: MatchNode[], id: string): MatchNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = findNode(node.children ?? [], id)
    if (child) return child
  }
  return undefined
}

export function elementLabel(nodes: MatchNode[], id: string): string {
  const node = findNode(nodes, id)
  if (!node) return id
  const idPart = node.idAttr ? `#${node.idAttr}` : ''
  const classPart = node.className
    ? node.className
        .split(/\s+/)
        .filter(Boolean)
        .map((name) => `.${name}`)
        .join('')
    : ''
  const typeAttr = node.attrs?.find((attr) => attr.name === 'type')
  const typePart = node.tag === 'input' && typeAttr ? `[type="${typeAttr.value}"]` : ''
  return `${node.tag}${idPart}${classPart}${typePart}`
}

export function describeSelection(question: MatchQuestion, ids: readonly string[]): string {
  if (ids.length === 0) return 'geen enkel element'
  return ids.map((id) => elementLabel(question.tree, id)).join(', ')
}

export function sameSelection(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((id, index) => id === b[index])
}

export function selectedIds(nodes: MatchNode[], selector: string): string[] {
  if (typeof DOMParser === 'undefined') return []
  const html = `<div id="match-root">${serializeTree(nodes)}</div>`
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.getElementById('match-root')
  if (!root) return []
  let found: NodeListOf<Element>
  try {
    found = root.querySelectorAll(selector)
  } catch {
    return []
  }
  const ids: string[] = []
  found.forEach((element) => {
    const id = element.getAttribute('data-pick')
    if (id) ids.push(id)
  })
  return ids
}

export function answerIds(question: MatchQuestion): string[] {
  if (typeof DOMParser === 'undefined') return [...question.answer]
  return selectedIds(question.tree, question.selector)
}
