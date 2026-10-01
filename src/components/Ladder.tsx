import type { RungId, RungView } from '../game/engine/ladder.ts'
import { Info, Lock } from './Icons.tsx'

const HELP: Record<RungId, string> = {
  match:
    'Alleen een selector die het element raakt, doet mee. In de specificity-levels is dat al gebeurd. In Wie wordt er geselecteerd is dit het niveau dat je speelt.',
  importance:
    'Hier hoort !important, en ook het verschil tussen je eigen stylesheet en die van de browser. Dit niveau zit op slot. Het hoort niet bij de specificity waarde.',
  layers:
    '@layer kan een zwaardere selector alsnog laten verliezen. Ook dit niveau zit op slot. De levels leren dat nog niet.',
  specificity:
    'In de specificity-levels is dit de vraag. Na je antwoord staat hier de specificity waarde, bijvoorbeeld 0-0-1-0. De cijfers worden niet opgeteld. Je vergelijkt van links naar rechts.',
  order:
    'Alleen als de specificity waarden gelijk zijn, wint de regel die later in de stylesheet staat. Zijn ze niet gelijk, dan blijft dit niveau uit. De volgorde beslist die ronde niet.',
}

const lockedPreview: RungView[] = [
  {
    id: 'match',
    label: 'Welke regels matchen',
    state: 'dim',
    detail: 'Dit niveau licht op na je antwoord.',
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
    detail: 'Dit niveau licht op na je antwoord.',
  },
  {
    id: 'order',
    label: 'Volgorde in de bron',
    state: 'dim',
    detail: 'Alleen als de specificity waarden gelijk zijn.',
  },
]

export function previewLadder(): RungView[] {
  return lockedPreview
}

export function previewMatchLadder(): RungView[] {
  return lockedPreview.map((rung) => {
    if (rung.id === 'match') {
      return { ...rung, detail: 'Dit niveau is de vraag. Duid de elementen aan.' }
    }
    if (rung.id === 'specificity') {
      return { ...rung, detail: 'De specificity waarde tel je in de andere levels.' }
    }
    return rung
  })
}

export function Ladder({ rungs }: { rungs: RungView[] }) {
  return (
    <ol className="ladder" aria-label="Cascade">
      {rungs.map((rung, index) => (
        <li key={rung.id} className={`rung is-${rung.state}`}>
          <span className="rung-index">{index + 1}</span>
          <div>
            <h3>
              <span className="rung-title">
                {rung.state === 'locked' ? (
                  <span className="lock-row">
                    <Lock />
                    {rung.label}
                  </span>
                ) : (
                  rung.label
                )}
                <span className="info">
                  <button type="button" className="info-btn" aria-label={`Uitleg over ${rung.label}`}>
                    <Info />
                  </button>
                  <span className="info-tip" role="tooltip">
                    {HELP[rung.id]}
                  </span>
                </span>
              </span>
            </h3>
            <p>{rung.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
