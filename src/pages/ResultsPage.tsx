import { matchQuestions, questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { generateQuestion, mulberry32 } from '../game/engine/generator.ts'
import { dailyQuestions } from '../game/levels/daily.ts'
import { questionsForRange, sampleRound } from '../game/levels/quizSet.ts'
import { levelInfo } from '../game/levels/catalog.ts'
import { loadResult } from '../storage.ts'
import { Stars } from '../components/Icons.tsx'

export function ResultsPage() {
  const { begin, navigate } = useApp()
  const result = loadResult()
  if (!result) {
    return (
      <div className="page empty">
        <h1>Geen ronde om te tonen.</h1>
        <button type="button" className="btn" onClick={() => navigate('/')}>
          Naar het begin
        </button>
      </div>
    )
  }

  function replay() {
    if (!result?.replay) {
      navigate('/')
      return
    }
    if (result.replay.mode === 'extra') {
      begin(
        createRun({
          mode: 'extra',
          pace: 'steady',
          asked: [generateQuestion(mulberry32(Date.now() >>> 0), 0)],
          set: null,
        }),
      )
      return
    }
    if (result.replay.mode === 'select') {
      begin(
        createRun({
          mode: 'select',
          pace: 'steady',
          asked: sampleRound(matchQuestions),
          set: null,
        }),
      )
      return
    }
    if (result.replay.mode === 'daily' && result.replay.date) {
      begin(
        createRun({
          mode: 'daily',
          pace: 'steady',
          asked: dailyQuestions(questions, result.replay.date),
          set: null,
          date: result.replay.date,
        }),
      )
      return
    }
    const set = result.replay.set
    const pool = set ? questionsForRange(questions, set) : questions
    const asked = sampleRound(pool)
    begin(
      createRun({
        mode: result.replay.mode === 'learn' ? 'learn' : 'practice',
        pace: 'steady',
        asked,
        set,
      }),
    )
  }

  const single = result.perLevel.length === 1 ? result.perLevel[0] : undefined

  return (
    <div className="page results">
      <h1>{result.title}</h1>
          <p className="lede">
            {result.correct} van {result.total} goed.
            {result.mode === 'extra' ? ' Dit telt niet mee voor sterren.' : ` Deze ronde leverde ${result.xp} xp op.`}
          </p>
          {single ? (
            <p>
              <Stars count={single.stars} />{' '}
              {single.unlockedNext && single.level < 5
                ? `${levelInfo(single.level + 1)?.name ?? 'Het volgende level'} is open.`
                : single.stars === 0
                  ? 'Nog geen ster. 70% opent het volgende level.'
                  : null}
            </p>
          ) : null}
          {result.trapsMissed > 0 ? (
            <p>{result.trapsMissed === 1 ? 'Eén valkuil gemist.' : `${result.trapsMissed} valkuilen gemist.`}</p>
          ) : null}
          {result.dailyBest ? (
            <p>
              Record van vandaag: {result.dailyBest.correct}/{result.dailyBest.total}.
            </p>
          ) : null}
      {result.perLevel.length > 1 ? (
        <ol className="path">
          {result.perLevel.map((level) => (
            <li key={level.level} className="station is-open">
              <span className="disc">{level.level}</span>
              <div>
                <h2>{levelInfo(level.level)?.name}</h2>
                <p>
                  <Stars count={level.stars} /> {level.correct}/{level.total}
                  {level.unlockedNext && level.level < 5 ? ' · het volgende level is open' : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="actions">
        <button type="button" className="btn" onClick={replay}>
          Nog een keer
        </button>
        <button type="button" className="btn secondary" onClick={() => navigate('/pad')}>
          Naar het pad
        </button>
      </div>
    </div>
  )
}
