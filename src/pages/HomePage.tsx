import { questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { sampleRound } from '../game/levels/quizSet.ts'
import { LEVELS } from '../game/levels/catalog.ts'
import { isLevelUnlocked } from '../game/scoring/scoring.ts'
import type { SavedRun } from '../types/progress.ts'

function openLevel(stars: (level: number) => number, unlocked: (level: number) => boolean): number {
  for (const level of LEVELS) {
    if (unlocked(level.level) && stars(level.level) === 0) return level.level
  }
  return LEVELS[LEVELS.length - 1]?.level ?? 1
}

function isSoloRun(run: SavedRun | null): run is SavedRun {
  return Boolean(run && (run.mode === 'practice' || run.mode === 'learn'))
}

export function HomePage() {
  const { progress, begin, navigate } = useApp()
  const run = isSoloRun(progress.continueRun) ? progress.continueRun : null
  const level = openLevel(
    (value) => progress.levels[value]?.bestStars ?? 0,
    (value) => isLevelUnlocked(value, progress),
  )

  function startLevel() {
    begin(
      createRun({
        mode: 'practice',
        pace: 'steady',
        asked: sampleRound(questions.filter((question) => question.level === level)),
        set: { from: level, to: level },
      }),
    )
  }

  return (
    <>
      <section className="home-intro">
        <div className="home-title">
          <h1>Tel de cascade.</h1>
          <p className="slogan">Waar CSS-selectors de strijd aangaan.</p>
        </div>
        <p className="lede">
          Ids, klassen, attributen en elementen.
          <br />
          Alleen, of daag iemand uit!
        </p>
      </section>
      <section className="arena" aria-label="Start een ronde">
        {run ? (
          <button type="button" className="arena-row" onClick={() => navigate('/spelen')}>
            Doorgaan
            <span>vraag {run.index + 1}</span>
          </button>
        ) : (
          <button type="button" className="arena-row" onClick={startLevel}>
            Start level {level}
            <span>{LEVELS.find((item) => item.level === level)?.name ?? 'Level'}</span>
          </button>
        )}
        <button type="button" className="arena-row" onClick={() => navigate('/twee')}>
          Speel met twee
          <span>Daag iemand uit</span>
        </button>
      </section>
    </>
  )
}
