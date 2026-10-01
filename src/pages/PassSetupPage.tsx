import { useState, type FormEvent } from 'react'
import { questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { createRun } from '../game/controller.ts'
import { LEVELS } from '../game/levels/catalog.ts'
import { formatRange, questionsForRange } from '../game/levels/quizSet.ts'
import { isLevelUnlocked } from '../game/scoring/scoring.ts'

export function PassSetupPage() {
  const { progress, range, begin } = useApp()
  const [nameA, setNameA] = useState('')
  const [nameB, setNameB] = useState('')
  const [level, setLevel] = useState(1)
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const left = nameA.trim().slice(0, 24)
    const right = nameB.trim().slice(0, 24)
    if (!left || !right) {
      setError('Beide namen zijn nodig. Ze blijven in deze ronde.')
      return
    }
    const asked = range ? questionsForRange(questions, range) : questions.filter((question) => question.level === level)
    begin(
      createRun({
        mode: 'pass',
        pace: 'steady',
        asked,
        set: range ?? { from: level, to: level },
        pass: {
          names: { a: left, b: right },
          turn: 'a',
          hearts: { a: 3, b: 3 },
          xp: { a: 0, b: 0 },
          streak: { a: 0, b: 0 },
          correct: { a: 0, b: 0 },
          answers: { a: null, b: null },
        },
      }),
    )
  }

  return (
    <div className="page">
      <h1>Geef de laptop door</h1>
      <p className="lede">
        Dezelfde vraag, om de beurt. Het antwoord blijft verborgen tot jullie allebei gekozen hebben. Drie levens,
        xp bij een treffer.
      </p>
      <form className="form" onSubmit={submit}>
        <label>
          Naam links
          <input value={nameA} onChange={(event) => setNameA(event.target.value)} maxLength={24} autoComplete="off" />
        </label>
        <label>
          Naam rechts
          <input value={nameB} onChange={(event) => setNameB(event.target.value)} maxLength={24} autoComplete="off" />
        </label>
        {range ? (
          <p>Set {formatRange(range)} staat klaar, ook als een level op het pad nog dicht is.</p>
        ) : (
          <fieldset className="level-picks">
            <legend>Level</legend>
            {LEVELS.map((item) => {
              const unlocked = isLevelUnlocked(item.level, progress)
              return (
                <button
                  key={item.level}
                  type="button"
                  className="btn secondary"
                  aria-pressed={level === item.level}
                  disabled={!unlocked}
                  onClick={() => setLevel(item.level)}
                >
                  {item.level} {item.name}
                </button>
              )
            })}
          </fieldset>
        )}
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" className="btn">
          Start de ronde
        </button>
      </form>
    </div>
  )
}
