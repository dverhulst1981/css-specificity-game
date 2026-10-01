import { buildSrcdoc } from '../css/sandbox.ts'
import type { RuleSpec } from '../types/question.ts'

function formatHtml(html: string): string {
  const lines = html
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  let depth = 0
  return lines
    .map((line) => {
      const closing = line.startsWith('</')
      const paired = !closing && /<\/[a-zA-Z][^>]*>$/.test(line)
      if (closing) depth = Math.max(0, depth - 1)
      const indented = `${'  '.repeat(depth)}${line}`
      if (!closing && !paired && !line.endsWith('/>')) depth += 1
      return indented
    })
    .join('\n')
}

export function Sandbox({ html, rules }: { html: string; rules: RuleSpec[] }) {
  return (
    <div className="sandbox">
      <div className="sandbox-block">
        <p className="sandbox-label">HTML</p>
        <pre>
          <code>{formatHtml(html)}</code>
        </pre>
      </div>
      <div className="sandbox-block">
        <p className="sandbox-label">Resultaat</p>
        <iframe title="Voorbeeld van het resultaat" sandbox="" srcDoc={buildSrcdoc(html, rules)} />
      </div>
    </div>
  )
}
