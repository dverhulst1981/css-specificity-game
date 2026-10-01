import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app-context.tsx'
import { Sandbox } from '../components/Sandbox.tsx'
import { Specimen } from '../components/Specimen.tsx'
import { emptyTuple, Stepper } from '../components/Stepper.tsx'
import { Ladder, previewLadder } from '../components/Ladder.tsx'
import { Hearts } from '../components/Icons.tsx'
import {
  applyBankResult,
  applyDailyResult,
  questionsFromRun,
  scoreResponse,
  streakPeak,
} from '../game/controller.ts'
import { ladderFor } from '../game/engine/ladder.ts'
import { generateQuestion, mulberry32 } from '../game/engine/generator.ts'
import { levelInfo } from '../game/levels/catalog.ts'
import { formatRange } from '../game/levels/quizSet.ts'
import { isLevelUnlocked, levelStats } from '../game/scoring/scoring.ts'
import { correctNotation, describeAnswer } from '../game/format.ts'
import { createTransport, type MatchTransport } from '../game/multiplayer/transport.ts'
import type { ResultSummary } from '../game/results.ts'
import { countCorrect, missedTraps } from '../game/results.ts'
import { saveResult } from '../storage.ts'
import type { Answer, Question } from '../types/question.ts'
import type { Progress, SavedRun } from '../types/progress.ts'
import { formatSpecificity, type Specificity } from '../types/specificity.ts'

const FIELDS = ['inline', 'ids', 'classes', 'elements'] as const

function focusedStep(target: EventTarget | null): { index: number; dir: 'inc' | 'dec' } | null {
  if (!(target instanceof HTMLElement)) return null
  const step = target.closest<HTMLElement>('[data-step]')
  if (!step?.dataset.step) return null
  const index = Number(step.dataset.step)
  if (!Number.isInteger(index) || index < 0 || index > 3) return null
  return { index, dir: target.dataset.stepDir === 'dec' ? 'dec' : 'inc' }
}

function focusStepButton(index: number, dir: 'inc' | 'dec') {
  document.querySelector<HTMLButtonElement>(`[data-step="${index}"] [data-step-dir="${dir}"]`)?.focus()
}

function passWinner(pass: NonNullable<SavedRun['pass']>): 'a' | 'b' | 'tie' {
  const aOut = pass.hearts.a <= 0
  const bOut = pass.hearts.b <= 0
  if (aOut && !bOut) return 'b'
  if (bOut && !aOut) return 'a'
  if (pass.xp.a !== pass.xp.b) return pass.xp.a > pass.xp.b ? 'a' : 'b'
  if (pass.hearts.a !== pass.hearts.b) return pass.hearts.a > pass.hearts.b ? 'a' : 'b'
  return 'tie'
}

function runTitle(run: SavedRun): string {
  if (run.mode === 'daily') return 'Dagelijkse ronde'
  if (run.mode === 'extra') return 'Extra oefenen'
  if (run.mode === 'pass' && run.pass) return `${run.pass.names.a} tegen ${run.pass.names.b}`
  const base =
    run.set && run.set.from !== run.set.to
      ? `Set ${formatRange(run.set)}`
      : run.set?.from
        ? (levelInfo(run.set.from)?.name ?? `Level ${run.set.from}`)
        : 'Ronde'
  if (run.mode === 'practice') return `${base} · Oefenen`
  if (run.mode === 'learn') return `${base} · Leren`
  return base
}

export function PlayPage() {
  const { progress, updateProgress, navigate } = useApp()
  const progressRef = useRef(progress)
  progressRef.current = progress
  const run = progress.continueRun
  const transportRef = useRef<MatchTransport>(createTransport('local-pass'))
  const [tuple, setTuple] = useState<Specificity>(emptyTuple())
  const [field, setField] = useState(0)
  const [battle, setBattle] = useState<'a' | 'b' | 'tie' | null>(null)
  const [ruleId, setRuleId] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(25)
  const timedOut = useRef(false)
  const roundKey = `${run?.index ?? ''}:${run?.phase ?? ''}:${run?.pass?.turn ?? ''}`
  const [seenRound, setSeenRound] = useState(roundKey)
  const [seenPace, setSeenPace] = useState(run?.pace)
  if (seenRound !== roundKey) {
    setSeenRound(roundKey)
    setSeenPace(run?.pace)
    setTuple(emptyTuple())
    setField(0)
    setBattle(null)
    setRuleId(null)
    setSeconds(25)
    timedOut.current = false
  } else if (seenPace !== run?.pace) {
    setSeenPace(run?.pace)
    setSeconds(25)
    timedOut.current = false
  }

  const asked = run ? questionsFromRun(run) : []
  const question = run ? asked[run.index] : undefined

  useEffect(() => {
    if (!run || run.mode !== 'pass' || !question) return
    const transport = createTransport('local-pass')
    if (run.pass?.answers.a) transport.submit('a', question.id, run.pass.answers.a)
    if (run.pass?.answers.b) transport.submit('b', question.id, run.pass.answers.b)
    transportRef.current = transport
  }, [run, question])

  useEffect(() => {
    if (!run || run.mode !== 'practice' || run.pace !== 'tempo' || run.phase !== 'ask') return
    const id = window.setInterval(() => {
      setSeconds((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [run])

  function finish(current: Progress, active: SavedRun, list: Question[]) {
    let next: Progress = { ...current, continueRun: null }
    if (active.mode === 'practice' || active.mode === 'learn') {
      next = applyBankResult(current, list, active.records)
    } else if (active.mode === 'daily' && active.date) {
      next = applyDailyResult(current, active.date, active.records, list.length)
    }
    const grouped = new Map<number, Question[]>()
    if (active.mode === 'practice' || active.mode === 'learn') {
      for (const item of list) {
        const bucket = grouped.get(item.level) ?? []
        bucket.push(item)
        grouped.set(item.level, bucket)
      }
    }
    const correctIds = new Set(active.records.filter((record) => record.correct).map((record) => record.questionId))
    const summary: ResultSummary = {
      mode: active.mode,
      title: runTitle(active),
      correct: active.pass ? active.pass.correct.a + active.pass.correct.b : countCorrect(active.records),
      total: active.pass ? active.index + 1 : list.length,
      xp: active.xp,
      bestStreak: streakPeak(active.records),
      trapsMissed: missedTraps(list, active.records),
      perLevel: [...grouped.entries()].map(([level, items]) => {
        const stats = levelStats(items, correctIds)
        const following = level + 1
        return {
          level,
          stars: stats.stars,
          correct: stats.correct,
          total: stats.total,
          unlockedNext: following <= 5 && isLevelUnlocked(following, next),
        }
      }),
      dailyBest: active.date ? (next.daily[active.date] ?? null) : null,
      replay: {
        mode: active.mode,
        set: active.set,
        date: active.date,
      },
      pass: active.pass
        ? {
            names: active.pass.names,
            xp: active.pass.xp,
            hearts: active.pass.hearts,
            correct: active.pass.correct,
            winner: passWinner(active.pass),
          }
        : undefined,
    }
    saveResult(summary)
    updateProgress(next)
    navigate('/resultaat')
  }

  function submitSolo(response: Answer | null, expired = false) {
    const current = progressRef.current
    const active = current.continueRun
    if (!active || active.phase !== 'ask' || active.mode === 'pass') return
    const list = questionsFromRun(active)
    const currentQuestion = list[active.index]
    if (!currentQuestion) return
    const scored = scoreResponse(currentQuestion, response, active.streak, expired)
    updateProgress({
      ...current,
      bestStreak: active.mode === 'extra' ? current.bestStreak : Math.max(current.bestStreak, scored.streak),
      continueRun: {
        ...active,
        phase: 'feedback',
        streak: scored.streak,
        xp: active.xp + scored.xp,
        records: [...active.records, scored.record],
      },
    })
  }

  function submitPass(response: Answer) {
    const current = progressRef.current
    const active = current.continueRun
    if (!active?.pass || active.phase !== 'ask') return
    const list = questionsFromRun(active)
    const currentQuestion = list[active.index]
    if (!currentQuestion) return
    const player = active.pass.turn
    transportRef.current.submit(player, currentQuestion.id, response)
    if (player === 'a') {
      updateProgress({
        ...current,
        continueRun: {
          ...active,
          phase: 'handoff',
          pass: {
            ...active.pass,
            turn: 'b',
            answers: { a: response, b: null },
          },
        },
      })
      return
    }
    const answerA = active.pass.answers.a
    if (!answerA) return
    const scoredA = scoreResponse(currentQuestion, answerA, active.pass.streak.a)
    const scoredB = scoreResponse(currentQuestion, response, active.pass.streak.b)
    updateProgress({
      ...current,
      continueRun: {
        ...active,
        phase: 'reveal',
        records: [...active.records, scoredA.record, scoredB.record],
        pass: {
          ...active.pass,
          turn: 'a',
          answers: { a: answerA, b: response },
          hearts: {
            a: Math.max(0, active.pass.hearts.a - (scoredA.correct ? 0 : 1)),
            b: Math.max(0, active.pass.hearts.b - (scoredB.correct ? 0 : 1)),
          },
          xp: { a: active.pass.xp.a + scoredA.xp, b: active.pass.xp.b + scoredB.xp },
          streak: { a: scoredA.streak, b: scoredB.streak },
          correct: {
            a: active.pass.correct.a + (scoredA.correct ? 1 : 0),
            b: active.pass.correct.b + (scoredB.correct ? 1 : 0),
          },
        },
      },
    })
  }

  function submitCurrent() {
    if (!question || !run || run.phase !== 'ask') return
    const response = responseFromState(question)
    if (!response) return
    if (run.mode === 'pass') submitPass(response)
    else submitSolo(response)
  }

  function responseFromState(currentQuestion: Question): Answer | null {
    if (currentQuestion.kind === 'specificity') return { kind: 'specificity', value: tuple }
    if (currentQuestion.kind === 'selector-battle') {
      return battle ? { kind: 'selector-battle', value: battle } : null
    }
    return ruleId ? { kind: 'which-rule-wins', ruleId } : null
  }

  function advance() {
    const current = progressRef.current
    const active = current.continueRun
    if (!active) return
    const list = questionsFromRun(active)
    if (active.mode === 'pass') {
      if (active.phase === 'handoff' && active.pass) {
        updateProgress({
          ...current,
          continueRun: { ...active, phase: 'ask', pass: { ...active.pass, turn: 'b' } },
        })
        return
      }
      if (active.phase !== 'reveal' || !active.pass) return
      const ended =
        active.pass.hearts.a === 0 || active.pass.hearts.b === 0 || active.index + 1 >= list.length
      if (ended) {
        finish(current, active, list)
        return
      }
      updateProgress({
        ...current,
        continueRun: {
          ...active,
          index: active.index + 1,
          phase: 'ask',
          pass: { ...active.pass, turn: 'a', answers: { a: null, b: null } },
        },
      })
      return
    }
    if (active.phase !== 'feedback') return
    if (active.mode === 'extra') {
      const extra = generateQuestion(mulberry32((Date.now() + list.length) >>> 0), list.length)
      const extraQuestions = [...list, extra]
      updateProgress({
        ...current,
        continueRun: {
          ...active,
          phase: 'ask',
          index: active.index + 1,
          extraQuestions,
          questionIds: extraQuestions.map((item) => item.id),
        },
      })
      return
    }
    if (active.index + 1 >= list.length) {
      finish(current, active, list)
      return
    }
    updateProgress({
      ...current,
      continueRun: { ...active, index: active.index + 1, phase: 'ask' },
    })
  }

  const timeoutRef = useRef<() => void>(() => {})
  timeoutRef.current = () => submitSolo(null, true)

  useEffect(() => {
    if (seconds !== 0 || timedOut.current) return
    const active = progressRef.current.continueRun
    if (!active || active.mode !== 'practice' || active.pace !== 'tempo' || active.phase !== 'ask') return
    timedOut.current = true
    timeoutRef.current()
  }, [seconds])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Enter' && target instanceof HTMLElement && target.tagName === 'BUTTON') {
        const inStepper = Boolean(target.closest('.stepper'))
        const picked = target.classList.contains('is-selected')
        const chooser = target.classList.contains('choice') || target.classList.contains('rule-btn')
        if (inStepper || (chooser && picked)) event.preventDefault()
        else return
      }
      const active = progressRef.current.continueRun
      const list = active ? questionsFromRun(active) : []
      const currentQuestion = active ? list[active.index] : undefined
      if (!active || !currentQuestion) return
      if (active.phase === 'feedback' || active.phase === 'reveal' || active.phase === 'handoff') {
        if (event.key === 'Enter') {
          event.preventDefault()
          advance()
        }
        return
      }
      if (currentQuestion.kind === 'specificity') {
        const step = focusedStep(target)
        const index = step?.index ?? field
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          const next = event.key === 'ArrowRight' ? (index + 1) % 4 : (index + 3) % 4
          setField(next)
          if (step) focusStepButton(next, step.dir)
          event.preventDefault()
        } else if (event.key === 'ArrowUp' || event.key === '+') {
          const key = FIELDS[index]
          setField(index)
          setTuple((current) => ({ ...current, [key]: Math.min(20, current[key] + 1) }))
          event.preventDefault()
        } else if (event.key === 'ArrowDown' || event.key === '-') {
          const key = FIELDS[index]
          setField(index)
          setTuple((current) => ({ ...current, [key]: Math.max(0, current[key] - 1) }))
          event.preventDefault()
        } else if (event.key === 'Enter') {
          event.preventDefault()
          submitCurrent()
        }
        return
      }
      if (currentQuestion.kind === 'selector-battle') {
        if (event.key.toLowerCase() === 'a') setBattle('a')
        if (event.key.toLowerCase() === 'b') setBattle('b')
        if (event.key.toLowerCase() === 'g') setBattle('tie')
        if (event.key === 'Enter') {
          event.preventDefault()
          submitCurrent()
        }
        return
      }
      if (/^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1
        const rule = currentQuestion.rules[index]
        if (rule) setRuleId(rule.id)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        submitCurrent()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!run || !question) {
    return (
      <div className="page empty">
        <h1>Geen ronde open.</h1>
        <button type="button" className="btn" onClick={() => navigate('/')}>
          Naar het begin
        </button>
      </div>
    )
  }

  const revealed = run.phase === 'feedback' || run.phase === 'reveal'
  const record = run.records[run.records.length - 1]
  const showSoloFeedback = run.phase === 'feedback' && record?.questionId === question.id

  if (run.phase === 'handoff' && run.pass) {
    return (
      <div className="page handoff">
        <h1>Kijk weg.</h1>
        <p className="lede">Geef de laptop aan {run.pass.names.b}. Het antwoord van {run.pass.names.a} blijft verborgen.</p>
        <button type="button" className="btn" onClick={advance}>
          Ik ben {run.pass.names.b}
        </button>
      </div>
    )
  }

  const playerName = run.pass ? run.pass.names[run.pass.turn] : null

  return (
    <div className="page">
      <div className="play">
        <div className="play-main">
          <div className="hud">
            <strong>
              {runTitle(run)}
              {playerName ? ` · Jij speelt als ${playerName}` : ''}
            </strong>
            <span>
              {run.index + 1}/{asked.length}
              {run.mode !== 'pass' ? ` · reeks ${run.streak}` : null}
            </span>
            {run.pass ? <Hearts count={run.pass.hearts[run.pass.turn]} /> : null}
            {run.mode === 'practice' ? (
              <div className="pace">
                <button
                  type="button"
                  className="btn secondary"
                  aria-pressed={run.pace === 'tempo'}
                  onClick={() =>
                    updateProgress({
                      ...progress,
                      continueRun: { ...run, pace: run.pace === 'tempo' ? 'steady' : 'tempo' },
                    })
                  }
                >
                  Tempo 25s
                </button>
                {run.pace === 'tempo' && run.phase === 'ask' ? <span className="pace-count">{seconds}</span> : null}
              </div>
            ) : null}
          </div>
          <h1 className="prompt">{question.prompt}</h1>
          {run.mode === 'practice' ? (
            <p className="mode-line">
              Oefenen: geen denkstap. De uitleg komt na je antwoord.
              {run.pace === 'tempo' ? ' Tempo staat aan, 25 seconden per vraag.' : ' Tempo staat uit.'}
            </p>
          ) : null}
          {run.mode === 'learn' ? (
            <p className="mode-line">
              Leren: de denkstap hieronder is een hint, niet het antwoord. Er loopt geen klok.
            </p>
          ) : null}
          {question.kind === 'specificity' ? <Specimen question={question} revealed={revealed} /> : null}
          {question.kind === 'which-rule-wins' ? <Sandbox html={question.html} rules={question.rules} /> : null}
          {run.mode === 'learn' && run.phase === 'ask' ? (
            <details className="lesson" open>
              <summary>Denkstap</summary>
              <p>{question.lesson}</p>
            </details>
          ) : null}
          {run.phase === 'ask' && question.kind === 'specificity' ? (
            <Stepper value={tuple} active={field} onChange={setTuple} onActivate={setField} />
          ) : null}
          {run.phase === 'ask' && question.kind === 'selector-battle' ? (
            <div className="choices two">
              <button type="button" className={battle === 'a' ? 'choice is-selected' : 'choice'} onClick={() => setBattle('a')}>
                <strong>A</strong>
                <code>{question.a}</code>
              </button>
              <button type="button" className={battle === 'b' ? 'choice is-selected' : 'choice'} onClick={() => setBattle('b')}>
                <strong>B</strong>
                <code>{question.b}</code>
              </button>
              <button type="button" className={battle === 'tie' ? 'choice is-selected' : 'choice'} onClick={() => setBattle('tie')}>
                <strong>Gelijk</strong>
                <code>dezelfde tuple</code>
              </button>
            </div>
          ) : null}
          {run.phase === 'ask' && question.kind === 'which-rule-wins' ? (
            <div className="rule-list">
              {question.rules.map((rule, index) => (
                <button
                  key={rule.id}
                  type="button"
                  className={ruleId === rule.id ? 'rule-btn is-selected' : 'rule-btn'}
                  onClick={() => setRuleId(rule.id)}
                >
                  <code>
                    {index + 1}. {rule.selector} {'{ '}
                    {rule.property}: {rule.value};{' }'}
                  </code>
                </button>
              ))}
            </div>
          ) : null}
          {run.phase === 'ask' ? (
            <div className="actions">
              <button type="button" className="btn" onClick={submitCurrent} disabled={responseFromState(question) === null}>
                Dit is mijn antwoord
              </button>
            </div>
          ) : null}
          {showSoloFeedback ? (
            <div className={record.correct ? 'feedback verdict-good' : 'feedback'} aria-live="polite">
              <h2>{record.timedOut ? 'De tijd is om.' : record.correct ? 'Goed.' : 'Mis.'}</h2>
              {question.trap && question.trapLead ? <p className="trap">{question.trapLead}</p> : null}
              <p>
                De uitkomst is <strong>{correctNotation(question)}</strong>
                {question.kind === 'specificity' ? '.' : ` (${describeAnswer(question, record.response)} was jouw keus).`}
              </p>
              {question.kind === 'specificity' ? <p>Jij zette {record.response && record.response.kind === 'specificity' ? formatSpecificity(record.response.value) : 'niets'}.</p> : null}
              <p>{question.explanation}</p>
              <div className="actions">
                <button type="button" className="btn" onClick={advance}>
                  {run.mode === 'extra' ? 'Volgende, ongescoord' : run.index + 1 >= asked.length ? 'Naar de uitslag' : 'Volgende'}
                </button>
                {run.mode === 'extra' ? (
                  <button type="button" className="btn secondary" onClick={() => finish(progress, run, asked)}>
                    Klaar
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {run.phase === 'reveal' && run.pass ? (
            <div aria-live="polite">
              <div className="reveal">
                <div className="reveal-a">
                  <h2>{run.pass.names.a}</h2>
                  <p>{describeAnswer(question, run.pass.answers.a)}</p>
                  <p>{run.pass.answers.a && isPlayerCorrect(question, run.pass.answers.a) ? 'Goed.' : 'Mis.'}</p>
                </div>
                <div className="reveal-b">
                  <h2>{run.pass.names.b}</h2>
                  <p>{describeAnswer(question, run.pass.answers.b)}</p>
                  <p>{run.pass.answers.b && isPlayerCorrect(question, run.pass.answers.b) ? 'Goed.' : 'Mis.'}</p>
                </div>
              </div>
              <div className="feedback">
                {question.trap && question.trapLead ? <p className="trap">{question.trapLead}</p> : null}
                <p>
                  De uitkomst is <strong>{correctNotation(question)}</strong>.
                </p>
                <p>{question.explanation}</p>
                <button type="button" className="btn" onClick={advance}>
                  {run.pass.hearts.a === 0 || run.pass.hearts.b === 0 || run.index + 1 >= asked.length
                    ? 'Naar de uitslag'
                    : 'Volgende vraag'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <Ladder rungs={revealed ? ladderFor(question) : previewLadder()} />
      </div>
    </div>
  )
}

function isPlayerCorrect(question: Question, response: Answer): boolean {
  return scoreResponse(question, response, 0).correct
}
