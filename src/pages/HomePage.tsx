import { matchQuestions, questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { generateQuestion, mulberry32 } from '../game/engine/generator.ts'
import { dailyQuestions, localIsoDate } from '../game/levels/daily.ts'
import { formatRange, questionsForRange, sampleRound } from '../game/levels/quizSet.ts'
import { LEVELS } from '../game/levels/catalog.ts'
import { isLevelUnlocked } from '../game/scoring/scoring.ts'

function openLevel(stars: (level: number) => number, unlocked: (level: number) => boolean): number {
  for (const level of LEVELS) {
    if (unlocked(level.level) && stars(level.level) === 0) return level.level
  }
  return LEVELS[LEVELS.length - 1]?.level ?? 1
}

export function HomePage() {
  const { progress, range, begin, navigate } = useApp()
  const today = localIsoDate()
  const dailyBest = progress.daily[today]
  const run = progress.continueRun
  const level = openLevel(
    (value) => progress.levels[value]?.bestStars ?? 0,
    (value) => isLevelUnlocked(value, progress),
  )
  const levelName = LEVELS.find((item) => item.level === level)?.name ?? 'Level'

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

  function startSet() {
    if (!range) return
    begin(
      createRun({
        mode: 'practice',
        pace: 'steady',
        asked: sampleRound(questionsForRange(questions, range)),
        set: range,
      }),
    )
  }

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

  function startDaily() {
    begin(
      createRun({
        mode: 'daily',
        pace: 'steady',
        asked: dailyQuestions(questions, today),
        set: null,
        date: today,
      }),
    )
  }

  function startExtra() {
    const rng = mulberry32(Date.now() >>> 0)
    begin(
      createRun({
        mode: 'extra',
        pace: 'steady',
        asked: [generateQuestion(rng, 0)],
        set: null,
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
          Inline, ids, klassen en elementen. Nooit optellen tot één getal.
          <br />
          Alleen, of tegen iemand op een tweede toestel.
        </p>
      </section>
      <section className="arena" aria-label="Start een ronde">
        {run ? (
          <button type="button" className="arena-row" onClick={() => navigate('/spelen')}>
            Doorgaan
            <span>
              vraag {run.index + 1}
            </span>
          </button>
        ) : (
          <button type="button" className="arena-row" onClick={startLevel}>
            Start {levelName}
            <span>level {level}</span>
          </button>
        )}
        {range ? (
          <button type="button" className="arena-row" onClick={startSet}>
            Start set {formatRange(range)}
            <span>link</span>
          </button>
        ) : null}
        <button type="button" className="arena-row" onClick={startSelect}>
          Wie wordt er geselecteerd
          <span>
            {progress.selectBest
              ? `record ${progress.selectBest.correct}/${progress.selectBest.total}`
              : 'duid de elementen aan'}
          </span>
        </button>
        <button type="button" className="arena-row" onClick={startDaily}>
          Dagelijkse ronde
          <span>{dailyBest ? `record ${dailyBest.correct}/${dailyBest.total}` : 'vijf vragen'}</span>
        </button>
        <button type="button" className="arena-row" onClick={() => navigate('/twee')}>
          Twee toestellen
          <span>code, geen server</span>
        </button>
      </section>
      <div className="page">
        <button type="button" className="quiet-link" onClick={startExtra}>
          Extra oefenen, ongescoord
        </button>
      </div>
    </>
  )
}
