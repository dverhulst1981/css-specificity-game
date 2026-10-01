import { matchQuestions, questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { LEVELS } from '../game/levels/catalog.ts'
import { sampleRound } from '../game/levels/quizSet.ts'
import { isLevelUnlocked } from '../game/scoring/scoring.ts'
import { Stars } from '../components/Icons.tsx'

export function PathPage() {
  const { progress, begin } = useApp()

  function startSelect() {
    begin(
      createRun({
        mode: 'select',
        pace: 'steady',
        asked: sampleRound(matchQuestions),
        set: null,
      }),
    )
  }

  function start(level: number, mode: 'practice' | 'learn') {
    begin(
      createRun({
        mode,
        pace: 'steady',
        asked: sampleRound(questions.filter((question) => question.level === level)),
        set: { from: level, to: level },
      }),
    )
  }

  return (
    <div className="page">
      <h1>Het pad</h1>
      <p className="lede">Zeven levels. Eén ster opent het volgende. Drie sterren eisen elke valkuil in die ronde.</p>
      <div className="mode-split">
        <p>
          <strong>Oefenen</strong> stelt dezelfde vragen zonder hint. Tempo is een schakelaar in de ronde: 15 seconden
          per vraag, of uit.
        </p>
        <p>
          <strong>Leren</strong> zet de denkstap open voordat je antwoordt. Die hint verklapt de specificity waarde niet. Er loopt
          geen klok.
        </p>
        <p>Beide rondes tellen voor sterren en xp.</p>
      </div>
      <ol className="path">
        {LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level.level, progress)
          const stars = progress.levels[level.level]?.bestStars ?? 0
          return (
            <li key={level.level} className={unlocked ? 'station is-open' : 'station is-locked'}>
              <span className="disc">{level.level}</span>
              <div>
                <h2>{level.name}</h2>
                <p>{level.blurb}</p>
                {unlocked ? (
                  <>
                    <p>
                      <Stars count={stars} />
                    </p>
                    <div className="station-actions">
                      <button type="button" className="btn" onClick={() => start(level.level, 'practice')}>
                        Oefenen
                        <span>zonder hint</span>
                      </button>
                      <button type="button" className="btn secondary" onClick={() => start(level.level, 'learn')}>
                        Leren
                        <span>met denkstap</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p>Eén ster op level {level.level - 1} opent dit.</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <h2 className="section-title">Wie wordt er geselecteerd</h2>
      <p className="lede">
        Een brok HTML en één selector. Duid elk element aan dat die selector raakt. Tien vragen, elke ronde een nieuwe
        greep.
      </p>
      <div className="actions">
        <button type="button" className="btn" onClick={startSelect}>
          Start een ronde
        </button>
      </div>
    </div>
  )
}
