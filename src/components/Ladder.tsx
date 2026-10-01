import type { RungView } from '../game/engine/ladder.ts'
import { Lock } from './Icons.tsx'

const lockedPreview: RungView[] = [
  {
    id: 'match',
    label: 'Welke regels matchen',
    state: 'dim',
    detail: 'Deze sport licht op na je antwoord.',
  },
  {
    id: 'importance',
    label: 'Origin en importance',
    state: 'locked',
    detail: '!important hoort hier, niet bij specificiteit.',
  },
  {
    id: 'layers',
    label: 'Cascade layers',
    state: 'locked',
    detail: 'Cascade layers blijven in deze levels gesloten.',
  },
  {
    id: 'specificity',
    label: 'Specificiteit',
    state: 'dim',
    detail: 'Deze sport licht op na je antwoord.',
  },
  {
    id: 'order',
    label: 'Volgorde in de bron',
    state: 'dim',
    detail: 'Alleen als de tuples gelijk zijn.',
  },
]

export function previewLadder(): RungView[] {
  return lockedPreview
}

export function Ladder({ rungs }: { rungs: RungView[] }) {
  return (
    <ol className="ladder" aria-label="Cascade">
      {rungs.map((rung, index) => (
        <li key={rung.id} className={`rung is-${rung.state}`}>
          <span className="rung-index">{index + 1}</span>
          <div>
            <h3>
              {rung.state === 'locked' ? (
                <span className="lock-row">
                  <Lock />
                  {rung.label}
                </span>
              ) : (
                rung.label
              )}
            </h3>
            <p>{rung.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
