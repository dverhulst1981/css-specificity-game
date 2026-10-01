import type { RuleSpec } from '../types/question.ts'

function declaration(rule: RuleSpec): string {
  const important = rule.important ? ' !important' : ''
  return `${rule.selector} { ${rule.property}: ${rule.value}${important}; }`
}

export function buildSrcdoc(html: string, rules: RuleSpec[]): string {
  const sorted = [...rules].sort((a, b) => a.sourceOrder - b.sourceOrder)
  const layers = [...new Map(sorted.filter((rule) => rule.layer?.name).map((rule) => [rule.layer!.order, rule.layer!.name])).entries()]
    .sort((a, b) => a[0] - b[0])
  const prelude = layers.length > 0 ? `@layer ${layers.map(([, name]) => name).join(', ')};` : ''
  const blocks = layers.map(([, name]) => {
    const body = sorted.filter((rule) => rule.layer?.name === name).map(declaration).join('\n')
    return `@layer ${name} {\n${body}\n}`
  })
  const plain = sorted.filter((rule) => !rule.layer).map(declaration)
  const css = [prelude, ...blocks, ...plain].filter(Boolean).join('\n')
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<style>
  body {
    margin: 0;
    background: oklch(1 0 0);
    color: oklch(0.22 0.025 55);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
  }
  .stage { padding: 20px; font-size: 20px; line-height: 1.4; }
  ${css}
</style>
</head>
<body><div class="stage">${html}</div></body>
</html>`
}
