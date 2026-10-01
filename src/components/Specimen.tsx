import { inspectSelector, type Token } from '../game/engine/parse.ts'
import type { Question } from '../types/question.ts'
import type { Specificity } from '../types/specificity.ts'

function bucketOf(value: Specificity): string {
  if (value.inline > 0) return 'inline'
  if (value.ids > 0) return 'ids'
  if (value.classes > 0) return 'classes'
  if (value.elements > 0) return 'elements'
  return 'none'
}

function Tokens({ selector, revealed }: { selector: string; revealed: boolean }) {
  let tokens: Token[] = []
  try {
    tokens = inspectSelector(selector).tokens
  } catch {
    tokens = []
  }
  if (!revealed) {
    return (
      <div className="tokens" aria-hidden="true">
        {tokens.map((token, index) => (
          <span className="token" style={{ ['--i' as string]: index }} key={`${token.text}-${index}`}>
            {token.text.trim() || '␣'}
          </span>
        ))}
      </div>
    )
  }
  const groups: Record<string, Token[]> = { inline: [], ids: [], classes: [], elements: [], none: [] }
  for (const token of tokens) groups[bucketOf(token.specificity)]?.push(token)
  const wells = [
    ['inline', 'inline'],
    ['ids', 'ids'],
    ['classes', 'klassen'],
    ['elements', 'elementen'],
  ] as const
  return (
    <div className="wells">
      {wells.map(([key, label]) => (
        <div className="well" key={key}>
          <span>{label}</span>
          <p>
            {groups[key]?.filter((token) => token.text.trim()).map((token) => token.text).join(' ') || '—'}
          </p>
        </div>
      ))}
    </div>
  )
}

export function Specimen({ question, revealed }: { question: Question; revealed: boolean }) {
  if (question.kind === 'specificity') {
    return (
      <div className="specimen">
        <p className="selector">{question.selector}</p>
        <Tokens selector={question.selector} revealed={revealed} />
      </div>
    )
  }
  if (question.kind === 'selector-battle') {
    return (
      <div className="specimen">
        <p className="selector">{question.a}</p>
        <p className="selector">{question.b}</p>
      </div>
    )
  }
  if (question.kind === 'who-matches') {
    return (
      <div className="specimen">
        <p className="selector">{question.selector}</p>
      </div>
    )
  }
  return (
    <div className="specimen">
      <p className="selector">{question.rules.map((rule) => rule.selector).join('  ')}</p>
    </div>
  )
}
