import { useEffect, useRef, useState } from 'react'
import { useApp } from '../app-context.tsx'
import { Sandbox } from '../components/Sandbox.tsx'
import { Specimen } from '../components/Specimen.tsx'
import { emptyTuple, Stepper } from '../components/Stepper.tsx'
import { MatchBoard } from '../components/MatchBoard.tsx'
import { Verdict } from '../components/Icons.tsx'
import {
  applyBankResult,
  questionsFromRun,
  scoreResponse,
  streakPeak,
} from '../game/controller.ts'
import { levelInfo, MAX_LEVEL } from '../game/levels/catalog.ts'
import { formatRange } from '../game/levels/quizSet.ts'
import { isLevelUnlocked, levelStats } from '../game/scoring/scoring.ts'
import { correctNotation, describeAnswer, formatDeclaration } from '../game/format.ts'
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

function usesTempo(run: SavedRun): boolean {
  return run.mode === 'practice' && run.pace === 'tempo'
}

function runTitle(run: SavedRun): string {
  const base =
    run.set && run.set.from !== run.set.to
      ? `Set ${formatRange(run.set)}`
      : run.set?.from
        ? (levelInfo(run.set.from)?.name ?? `Level ${run.set.from}`)
        : 'Ronde'
  if (run.mode === 'practice') return `${base} · Oefenen`
  return `${base} · Leren`
}

export function PlayPage() {
  const { progress, updateProgress, navigate } = useApp()
  const progressRef = useRef(progress)
  progressRef.current = progress
  const run = progress.continueRun
  const [tuple, setTuple] = useState<Specificity>(emptyTuple())
  const [field, setField] = useState(0)
  const [battle, setBattle] = useState<'a' | 'b' | 'tie' | null>(null)
  const [ruleId, setRuleId] = useState<string | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const [seconds, setSeconds] = useState(15)
  const timedOut = useRef(false)
  const roundKey = `${run?.index ?? ''}:${run?.phase ?? ''}`
  const [seenRound, setSeenRound] = useState(roundKey)
  const [seenPace, setSeenPace] = useState(run?.pace)
  if (seenRound !== roundKey) {
    setSeenRound(roundKey)
    setSeenPace(run?.pace)
    setTuple(emptyTuple())
    setField(0)
    setBattle(null)
    setRuleId(null)
    setPicks([])
    setSeconds(15)
    timedOut.current = false
  } else if (seenPace !== run?.pace) {
    setSeenPace(run?.pace)
    setSeconds(15)
    timedOut.current = false
  }

  const asked = run ? questionsFromRun(run) : []
  const question = run ? asked[run.index] : undefined

  useEffect(() => {
    if (!run || !usesTempo(run) || run.phase !== 'ask') return
    const id = window.setInterval(() => {
      setSeconds((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [run])

  function finish(current: Progress, active: SavedRun, list: Question[]) {
    const next = applyBankResult(current, list, active.records)
    const grouped = new Map<number, Question[]>()
    for (const item of list) {
      const bucket = grouped.get(item.level) ?? []
      bucket.push(item)
      grouped.set(item.level, bucket)
    }
    const correctIds = new Set(active.records.filter((record) => record.correct).map((record) => record.questionId))
    const summary: ResultSummary = {
      mode: active.mode,
      title: runTitle(active),
      correct: countCorrect(active.records),
      total: list.length,
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
          unlockedNext: following <= MAX_LEVEL && isLevelUnlocked(following, next),
        }
      }),
      replay: {
        mode: active.mode,
        set: active.set,
      },
    }
    saveResult(summary)
    updateProgress(next)
    navigate('/resultaat')
  }

  function submitSolo(response: Answer | null, expired = false) {
    const current = progressRef.current
    const active = current.continueRun
    if (!active || active.phase !== 'ask') return
    const list = questionsFromRun(active)
    const currentQuestion = list[active.index]
    if (!currentQuestion) return
    const scored = scoreResponse(currentQuestion, response, active.streak, expired)
    updateProgress({
      ...current,
      bestStreak: Math.max(current.bestStreak, scored.streak),
      continueRun: {
        ...active,
        phase: 'feedback',
        streak: scored.streak,
        xp: active.xp + scored.xp,
        records: [...active.records, scored.record],
      },
    })
  }

  function submitCurrent() {
    if (!question || !run || run.phase !== 'ask') return
    const response = responseFromState(question)
    if (!response) return
    submitSolo(response)
  }

  function responseFromState(currentQuestion: Question): Answer | null {
    if (currentQuestion.kind === 'specificity') return { kind: 'specificity', value: tuple }
    if (currentQuestion.kind === 'selector-battle') {
      return battle ? { kind: 'selector-battle', value: battle } : null
    }
    if (currentQuestion.kind === 'who-matches') return { kind: 'who-matches', ids: picks }
    if (currentQuestion.kind === 'which-rule-wins') return ruleId ? { kind: 'which-rule-wins', ruleId } : null
    return null
  }

  function advance() {
    const current = progressRef.current
    const active = current.continueRun
    if (!active) return
    const list = questionsFromRun(active)
    if (active.phase !== 'feedback') return
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
    if (!active || !usesTempo(active) || active.phase !== 'ask') return
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
      if (active.phase === 'feedback') {
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
      if (currentQuestion.kind === 'who-matches') {
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

  const revealed = run.phase === 'feedback'
  const record = run.records[run.records.length - 1]
  const showSoloFeedback = run.phase === 'feedback' && record?.questionId === question.id

  return (
    <div className="page">
      <div className="play">
        <div className="play-main">
          <div className="hud">
            <strong>{runTitle(run)}</strong>
            <span>
              {run.index + 1}/{asked.length} · reeks {run.streak}
            </span>
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
                  Tempo 15s
                </button>
                {run.pace === 'tempo' && run.phase === 'ask' ? <span className="pace-count">{seconds}</span> : null}
              </div>
            ) : null}
          </div>
          <h1 className="prompt">{question.prompt}</h1>
          {run.mode === 'practice' ? (
            <p className="mode-line">
              Oefenen: geen denkstap. De uitleg komt na je antwoord.
              {run.pace === 'tempo' ? ' Tempo staat aan, 15 seconden per vraag.' : ' Tempo staat uit.'}
            </p>
          ) : null}
          {run.mode === 'learn' ? (
            <p className="mode-line">
              Leren: de denkstap hieronder is een hint, niet het antwoord. Er loopt geen klok.
            </p>
          ) : null}
          {question.kind === 'specificity' ? <Specimen question={question} revealed={revealed} /> : null}
          {question.kind === 'who-matches' ? (
            <MatchBoard
              question={question}
              picked={
                revealed ? (record?.response?.kind === 'who-matches' ? record.response.ids : []) : picks
              }
              revealed={revealed}
              onToggle={(id) =>
                setPicks((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
              }
            />
          ) : null}
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
                <code>dezelfde specificity waarde</code>
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
                    {index + 1}. {formatDeclaration(rule)}
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
              <h2>
                {record.timedOut ? 'De tijd is om.' : record.correct ? 'Goed.' : 'Mis.'}
                <Verdict correct={record.correct} />
              </h2>
              {question.trap && question.trapLead ? <p className="trap">{question.trapLead}</p> : null}
              <p>
                De uitkomst is <strong>{correctNotation(question)}</strong>
                {question.kind === 'specificity' ? '.' : ` (${describeAnswer(question, record.response)} was jouw keus).`}
              </p>
              {question.kind === 'specificity' ? <p>Jij zette {record.response && record.response.kind === 'specificity' ? formatSpecificity(record.response.value) : 'niets'}.</p> : null}
              <p>{question.explanation}</p>
              <div className="actions">
                <button type="button" className="btn" onClick={advance}>
                  {run.index + 1 >= asked.length ? 'Naar de uitslag' : 'Volgende'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
