import { answerIds, htmlLines } from '../game/engine/match.ts'
import type { MatchQuestion } from '../types/question.ts'

export function MatchBoard({
  question,
  picked,
  revealed,
  locked = false,
  onToggle,
}: {
  question: MatchQuestion
  picked: readonly string[]
  revealed: boolean
  locked?: boolean
  onToggle: (id: string) => void
}) {
  const lines = htmlLines(question.tree)
  const answer = new Set(revealed ? answerIds(question) : [])
  const chosen = new Set(picked)
  return (
    <div className="match">
      <div className="specimen">
        <p className="selector">{question.selector}</p>
      </div>
      <div className="match-html" role="group" aria-label="HTML">
        {lines.map((line, index) => {
          const pad = { paddingLeft: `${12 + line.depth * 20}px` }
          if (!line.pickId) {
            return (
              <div key={`gap-${index}`} className="match-line is-static" style={pad}>
                <code>{line.source}</code>
              </div>
            )
          }
          const id = line.pickId
          const on = chosen.has(id)
          const should = answer.has(id)
          const mark = revealed
            ? should && on
              ? ' is-hit'
              : should
                ? ' is-miss'
                : on
                  ? ' is-extra'
                  : ''
            : on
              ? ' is-selected'
              : ''
          const status = !revealed
            ? line.source
            : should && on
              ? `${line.source}. Goed aangevinkt.`
              : should
                ? `${line.source}. Deze hoorde erbij.`
                : on
                  ? `${line.source}. Deze hoort er niet bij.`
                  : line.source
          return (
            <button
              key={id}
              type="button"
              className={`match-line${mark}`}
              style={pad}
              aria-pressed={on}
              aria-label={status}
              disabled={revealed || locked}
              onClick={() => onToggle(id)}
            >
              <code>{line.source}</code>
            </button>
          )
        })}
      </div>
      <p className="match-legend">
        {revealed
          ? 'Gemarkeerd en goed. Een blauwe rand miste je. Doorgestreept hoort er niet bij.'
          : picked.length === 0
            ? 'Klik elk element dat de selector raakt. Niets aanklikken betekent: niemand.'
            : picked.length === 1
              ? '1 element aangevinkt. Een tweede klik wist het.'
              : `${picked.length} elementen aangevinkt. Een tweede klik wist een element.`}
      </p>
    </div>
  )
}
