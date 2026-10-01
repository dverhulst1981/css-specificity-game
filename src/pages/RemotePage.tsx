import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { questionById, questions } from '../data/questions/index.ts'
import { useApp } from '../app-context.tsx'
import { Sandbox } from '../components/Sandbox.tsx'
import { Specimen } from '../components/Specimen.tsx'
import { emptyTuple, Stepper } from '../components/Stepper.tsx'
import { Ladder, previewLadder } from '../components/Ladder.tsx'
import { Hearts, Verdict } from '../components/Icons.tsx'
import { ladderFor } from '../game/engine/ladder.ts'
import { isCorrect } from '../game/engine/solve.ts'
import { correctNotation, describeAnswer } from '../game/format.ts'
import { LEVELS } from '../game/levels/catalog.ts'
import { formatRange, questionsForRange } from '../game/levels/quizSet.ts'
import { RemotePeer, SignalError } from '../game/multiplayer/remote.ts'
import { isLevelUnlocked } from '../game/scoring/scoring.ts'
import type { Answer, Question } from '../types/question.ts'
import type { Specificity } from '../types/specificity.ts'

type Stage = 'pick' | 'host' | 'guest'

export function RemotePage() {
  const { progress, range } = useApp()
  const [stage, setStage] = useState<Stage>('pick')
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)
  const [paste, setPaste] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const [copied, setCopied] = useState(false)
  const [peer, setPeer] = useState<RemotePeer | null>(null)
  const peerRef = useRef<RemotePeer | null>(null)
  const mounted = useRef(true)
  const revision = useSyncExternalStore(
    (listener) => peer?.subscribe(listener) ?? (() => {}),
    () => peer?.revision ?? 0,
  )

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      peerRef.current?.close()
    }
  }, [])

  function hold(next: RemotePeer | null) {
    peerRef.current = next
    setPeer(next)
  }

  function reset() {
    peerRef.current?.close()
    hold(null)
    setPaste('')
    setError('')
    setPending('')
    setCopied(false)
    setStage('pick')
  }

  async function startHost(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim().slice(0, 24)
    if (!trimmed) {
      setError('Je naam is nodig. Die ziet de ander straks.')
      return
    }
    const asked = range ? questionsForRange(questions, range) : questions.filter((item) => item.level === level)
    setError('')
    setPending('Het pad wordt gezocht. De code verschijnt zodra dat klaar is.')
    try {
      const next = await RemotePeer.openHost(trimmed, asked.map((item) => item.id))
      if (!mounted.current) {
        next.close()
        return
      }
      hold(next)
      setPending('')
    } catch (caught) {
      setPending('')
      setError(caught instanceof SignalError ? caught.message : 'De code kon niet gemaakt worden.')
    }
  }

  async function startGuest(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim().slice(0, 24)
    if (!trimmed) {
      setError('Je naam is nodig. Die ziet de ander straks.')
      return
    }
    if (!paste.trim()) {
      setError('Plak eerst de code van speler 1.')
      return
    }
    setError('')
    setPending('De antwoordcode wordt gemaakt.')
    try {
      const next = await RemotePeer.openGuest(trimmed, paste)
      if (!mounted.current) {
        next.close()
        return
      }
      hold(next)
      setPending('')
    } catch (caught) {
      setPending('')
      setError(caught instanceof SignalError ? caught.message : 'Die code is niet volledig. Kopieer opnieuw met de knop.')
    }
  }

  async function connectAnswer(event: FormEvent) {
    event.preventDefault()
    if (!peer) return
    setError('')
    try {
      await peer.acceptAnswer(paste)
      setPaste('')
    } catch (caught) {
      setError(caught instanceof SignalError ? caught.message : 'Die antwoordcode werkt niet. Plak de hele code van speler 2.')
    }
  }

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
      setError('Kopiëren lukt niet in deze browser. Selecteer de code en kopieer hem zelf.')
    }
  }

  if (revision < 0) return null

  if (!peer && pending) {
    return (
      <div className="page">
        <h1>Twee toestellen</h1>
        <p className="lede">{pending}</p>
      </div>
    )
  }

  if (peer?.view.dropped) {
    return (
      <div className="page">
        <h1>De verbinding is weg.</h1>
        <p className="lede">De ronde stopt hier. Begin opnieuw als jullie allebei nog willen spelen.</p>
        <button type="button" className="btn" onClick={reset}>
          Opnieuw
        </button>
      </div>
    )
  }

  if (peer && (peer.view.phase === 'offer' || peer.view.phase === 'connecting')) {
    return (
      <div className="page">
        <h1>Code voor speler 2</h1>
        <p className="lede">
          Stuur deze code naar het andere toestel. Gebruik de knop, dan gaat het hele blok mee. Speler 2 stuurt daarna
          een antwoordcode terug. Plak die hier.
        </p>
        <label className="code-label">
          Jouw code
          <textarea
            className="code-box"
            readOnly
            value={peer.view.localCode}
            rows={8}
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <p className="code-count">{peer.view.localCode.replace(/\s+/g, '').length} tekens</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => copyCode(peer.view.localCode)}>
            {copied ? 'Gekopieerd' : 'Kopieer de code'}
          </button>
        </div>
        <form className="form" onSubmit={connectAnswer}>
          <label>
            Antwoordcode van speler 2
            <textarea className="code-box" value={paste} onChange={(event) => setPaste(event.target.value)} rows={6} spellCheck={false} autoCapitalize="off" />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          {peer.view.phase === 'connecting' ? <p>De verbinding komt zo. Laat dit scherm open.</p> : null}
          <button type="submit" className="btn">
            Verbind
          </button>
        </form>
      </div>
    )
  }

  if (peer && peer.view.phase === 'reply') {
    return (
      <div className="page">
        <h1>Antwoordcode</h1>
        <p className="lede">
          Stuur deze code terug naar speler 1 met de knop. De ronde begint als dat hele blok daar geplakt is.
        </p>
        <label className="code-label">
          Jouw antwoordcode
          <textarea
            className="code-box"
            readOnly
            value={peer.view.localCode}
            rows={8}
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <p className="code-count">{peer.view.localCode.replace(/\s+/g, '').length} tekens</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => copyCode(peer.view.localCode)}>
            {copied ? 'Gekopieerd' : 'Kopieer de code'}
          </button>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        <p>Laat dit scherm open.</p>
      </div>
    )
  }

  if (peer && peer.view.phase === 'open') {
    return <RemotePlay peer={peer} onLeave={reset} />
  }

  if (stage === 'host') {
    return (
      <div className="page">
        <h1>Speler 1</h1>
        <p className="lede">Jij maakt de code. Het level kies je hier. Beide toestellen krijgen dezelfde vragen.</p>
        <form className="form" onSubmit={startHost}>
          <label>
            Jouw naam
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} autoComplete="off" />
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
            Maak de code
          </button>
        </form>
      </div>
    )
  }

  if (stage === 'guest') {
    return (
      <div className="page">
        <h1>Speler 2</h1>
        <p className="lede">Plak de code van speler 1. Daarna krijg je een antwoordcode om terug te sturen.</p>
        <form className="form" onSubmit={startGuest}>
          <label>
            Jouw naam
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} autoComplete="off" />
          </label>
          <label>
            Code van speler 1
            <textarea className="code-box" value={paste} onChange={(event) => setPaste(event.target.value)} rows={6} spellCheck={false} autoCapitalize="off" />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="btn">
            Maak de antwoordcode
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Twee toestellen</h1>
      <p className="lede">
        Elk een eigen scherm. Speler 1 maakt een code, speler 2 stuurt een antwoordcode terug. Er is geen server van
        ons. Antwoorden blijven verborgen tot jullie allebei gekozen hebben.
      </p>
      <div className="actions">
        <button type="button" className="btn" onClick={() => { setError(''); setStage('host') }}>
          Ik start
        </button>
        <button type="button" className="btn secondary" onClick={() => { setError(''); setStage('guest') }}>
          Ik doe mee
        </button>
      </div>
    </div>
  )
}

function RemotePlay({ peer, onLeave }: { peer: RemotePeer; onLeave: () => void }) {
  const view = peer.view
  const question = questionById(view.questionIds[view.index] ?? '')
  const player = view.role === 'host' ? 'a' : 'b'
  const [tuple, setTuple] = useState<Specificity>(emptyTuple())
  const [field, setField] = useState(0)
  const [battle, setBattle] = useState<'a' | 'b' | 'tie' | null>(null)
  const [ruleId, setRuleId] = useState<string | null>(null)
  const roundKey = `${view.index}:${view.playPhase}`
  const [seen, setSeen] = useState(roundKey)
  if (seen !== roundKey && view.playPhase === 'ask') {
    setSeen(roundKey)
    setTuple(emptyTuple())
    setField(0)
    setBattle(null)
    setRuleId(null)
  }

  function responseOf(current: Question): Answer | null {
    if (current.kind === 'specificity') return { kind: 'specificity', value: tuple }
    if (current.kind === 'selector-battle') return battle ? { kind: 'selector-battle', value: battle } : null
    return ruleId ? { kind: 'which-rule-wins', ruleId } : null
  }

  if (!question) {
    return (
      <div className="page">
        <h1>Deze vraag zit niet in deze versie.</h1>
        <button type="button" className="btn" onClick={onLeave}>
          Stop
        </button>
      </div>
    )
  }

  const revealed = view.playPhase === 'reveal' || view.playPhase === 'done'
  const name = view.names[player] || (player === 'a' ? 'Speler 1' : 'Speler 2')

  return (
    <div className="page">
      <div className="play">
        <div className="play-main">
          <div className="hud">
            <strong>
              {view.names.a || 'Speler 1'} tegen {view.names.b || 'Speler 2'} · Jij speelt als {name}
            </strong>
            <span>
              {view.index + 1}/{view.questionIds.length}
            </span>
            <Hearts count={view.score.hearts[player]} />
          </div>
          <h1 className="prompt">{question.prompt}</h1>
          {question.kind === 'specificity' ? <Specimen question={question} revealed={revealed} /> : null}
          {question.kind === 'which-rule-wins' ? <Sandbox html={question.html} rules={question.rules} /> : null}
          {view.playPhase === 'ask' && question.kind === 'specificity' ? (
            <Stepper value={tuple} active={field} onChange={setTuple} onActivate={setField} />
          ) : null}
          {view.playPhase === 'ask' && question.kind === 'selector-battle' ? (
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
          {view.playPhase === 'ask' && question.kind === 'which-rule-wins' ? (
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
          {view.playPhase === 'ask' ? (
            <div className="actions">
              <button
                type="button"
                className="btn"
                disabled={responseOf(question) === null}
                onClick={() => {
                  const response = responseOf(question)
                  if (response) peer.submit(response)
                }}
              >
                Dit is mijn antwoord
              </button>
            </div>
          ) : null}
          {view.playPhase === 'wait' ? (
            <p className="mode-line">Je antwoord staat vast. De ander ziet het nog niet.</p>
          ) : null}
          {revealed ? (
            <div aria-live="polite">
              <div className="reveal">
                <div className="reveal-a">
                  <h2>
                    {view.names.a || 'Speler 1'}
                    <Verdict correct={isCorrect(question, view.shown.a)} />
                  </h2>
                  <p>{describeAnswer(question, view.shown.a)}</p>
                  <p>{view.score.hearts.a} levens · {view.score.xp.a} xp</p>
                </div>
                <div className="reveal-b">
                  <h2>
                    {view.names.b || 'Speler 2'}
                    <Verdict correct={isCorrect(question, view.shown.b)} />
                  </h2>
                  <p>{describeAnswer(question, view.shown.b)}</p>
                  <p>{view.score.hearts.b} levens · {view.score.xp.b} xp</p>
                </div>
              </div>
              <div className="feedback">
                {question.trap && question.trapLead ? <p className="trap">{question.trapLead}</p> : null}
                <p>
                  De uitkomst is <strong>{correctNotation(question)}</strong>.
                </p>
                <p>{question.explanation}</p>
                {view.playPhase === 'done' ? (
                  <p>
                    {view.winner === 'tie'
                      ? 'Gelijkspel.'
                      : `${view.winner === 'a' ? view.names.a || 'Speler 1' : view.names.b || 'Speler 2'} wint dit spel.`}
                  </p>
                ) : null}
                <div className="actions">
                  {view.role === 'host' && view.playPhase === 'reveal' ? (
                    <button type="button" className="btn" onClick={() => peer.next()}>
                      Volgende vraag
                    </button>
                  ) : null}
                  {view.role === 'guest' && view.playPhase === 'reveal' ? (
                    <p className="mode-line">Speler 1 opent de volgende vraag.</p>
                  ) : null}
                  {view.playPhase === 'done' ? (
                    <button type="button" className="btn secondary" onClick={onLeave}>
                      Klaar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <Ladder rungs={revealed ? ladderFor(question) : previewLadder()} />
      </div>
    </div>
  )
}
