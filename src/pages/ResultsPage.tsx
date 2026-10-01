import { questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { questionsForRange, sampleRound } from '../game/levels/quizSet.ts'
import { levelInfo, MAX_LEVEL } from '../game/levels/catalog.ts'
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
        {result.correct} van {result.total} goed. Deze ronde leverde {result.xp} xp op.
      </p>
      {single ? (
        <p>
          <Stars count={single.stars} />{' '}
          {single.unlockedNext && single.level < MAX_LEVEL
            ? `${levelInfo(single.level + 1)?.name ?? 'Het volgende level'} is open.`
            : single.stars === 0
              ? 'Nog geen ster. 70% opent het volgende level.'
              : null}
        </p>
      ) : null}
      {result.trapsMissed > 0 ? (
        <p>{result.trapsMissed === 1 ? 'Eén valkuil gemist.' : `${result.trapsMissed} valkuilen gemist.`}</p>
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
                  {level.unlockedNext && level.level < MAX_LEVEL ? ' · het volgende level is open' : ''}
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
