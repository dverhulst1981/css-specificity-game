import type { RuleSpec } from '../types/question.ts'

export function buildSrcdoc(html: string, rules: RuleSpec[]): string {
  const css = rules
    .map((rule) => {
      const important = rule.important ? ' !important' : ''
      return `${rule.selector} { ${rule.property}: ${rule.value}${important}; }`
    })
    .join('\n')
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
