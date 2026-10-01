import { questionById } from '../../data/questions/index.ts'
import { scoreResponse } from '../controller.ts'
import type { Answer } from '../../types/question.ts'
import { decodeSignal, encodeSignal, SignalError } from './signal.ts'
import { createTransport, type RemoteTransport } from './transport.ts'

const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export type RemoteRole = 'host' | 'guest'

export type ScoreSnap = {
  hearts: { a: number; b: number }
  xp: { a: number; b: number }
  streak: { a: number; b: number }
  correct: { a: number; b: number }
}

export type RemoteView = {
  role: RemoteRole
  phase: 'offer' | 'reply' | 'connecting' | 'open' | 'closed'
  localCode: string
  dropped: boolean
  names: { a: string; b: string }
  questionIds: string[]
  index: number
  playPhase: 'ask' | 'wait' | 'reveal' | 'done'
  shown: { a: Answer | null; b: Answer | null }
  score: ScoreSnap
  winner: 'a' | 'b' | 'tie' | null
  localSent: boolean
}

type HelloMessage = { type: 'hello'; name: string }
type RoundMessage = { type: 'round'; questionIds: string[]; names: { a: string; b: string }; index: number; score: ScoreSnap }
type AnswerMessage = { type: 'answer'; questionId: string; answer: Answer }
type RevealMessage = {
  type: 'reveal'
  questionId: string
  answers: { a: Answer; b: Answer }
  score: ScoreSnap
  finished: boolean
  winner: 'a' | 'b' | 'tie' | null
}
type NextMessage = { type: 'next'; index: number }
type WireMessage = HelloMessage | RoundMessage | AnswerMessage | RevealMessage | NextMessage

const emptyScore = (): ScoreSnap => ({
  hearts: { a: 3, b: 3 },
  xp: { a: 0, b: 0 },
  streak: { a: 0, b: 0 },
  correct: { a: 0, b: 0 },
})

function winnerOf(score: ScoreSnap): 'a' | 'b' | 'tie' {
  const aOut = score.hearts.a <= 0
  const bOut = score.hearts.b <= 0
  if (aOut && !bOut) return 'b'
  if (bOut && !aOut) return 'a'
  if (score.xp.a !== score.xp.b) return score.xp.a > score.xp.b ? 'a' : 'b'
  if (score.hearts.a !== score.hearts.b) return score.hearts.a > score.hearts.b ? 'a' : 'b'
  return 'tie'
}

function isAnswer(value: unknown): value is Answer {
  if (!value || typeof value !== 'object') return false
  const answer = value as Answer
  if (answer.kind === 'specificity') return Boolean(answer.value)
  if (answer.kind === 'selector-battle') return answer.value === 'a' || answer.value === 'b' || answer.value === 'tie'
  if (answer.kind === 'which-rule-wins') return typeof answer.ruleId === 'string'
  return false
}

export class RemotePeer {
  revision = 0
  readonly view: RemoteView
  private readonly pc = new RTCPeerConnection(STUN)
  private channel: RTCDataChannel | null = null
  private readonly transport: RemoteTransport
  private readonly listeners = new Set<() => void>()
  private silent = false

  private readonly ownName: string

  private constructor(role: RemoteRole, ownName: string, questionIds: string[]) {
    this.ownName = ownName
    this.view = {
      role,
      phase: role === 'host' ? 'connecting' : 'reply',
      localCode: '',
      dropped: false,
      names: { a: role === 'host' ? ownName : '', b: role === 'guest' ? ownName : '' },
      questionIds,
      index: 0,
      playPhase: 'ask',
      shown: { a: null, b: null },
      score: emptyScore(),
      winner: null,
      localSent: false,
    }
    const player = role === 'host' ? 'a' : 'b'
    this.transport = createTransport('remote', {
      role: player,
      send: (message) => this.send(message),
    })
    if (role === 'host') this.transport.subscribe(() => this.maybeReveal())
    this.pc.addEventListener('connectionstatechange', () => {
      const state = this.pc.connectionState
      if (state === 'failed' || state === 'closed') this.markDropped()
      if (state === 'disconnected' && (this.view.phase === 'open' || this.view.phase === 'connecting')) this.markDropped()
    })
  }

  static async openHost(name: string, questionIds: string[]): Promise<RemotePeer> {
    const peer = new RemotePeer('host', name, questionIds)
    const channel = peer.pc.createDataChannel('match')
    peer.bindChannel(channel)
    const offer = await peer.pc.createOffer()
    await peer.pc.setLocalDescription(offer)
    await waitForIce(peer.pc)
    peer.view.localCode = await encodeSignal(peer.pc.localDescription?.sdp ?? '')
    peer.view.phase = 'offer'
    peer.emit()
    return peer
  }

  static async openGuest(name: string, offerCode: string): Promise<RemotePeer> {
    const peer = new RemotePeer('guest', name, [])
    peer.pc.addEventListener('datachannel', (event) => peer.bindChannel(event.channel))
    const sdp = await decodeSignal(offerCode)
    await peer.pc.setRemoteDescription({ type: 'offer', sdp })
    const answer = await peer.pc.createAnswer()
    await peer.pc.setLocalDescription(answer)
    await waitForIce(peer.pc)
    peer.view.localCode = await encodeSignal(peer.pc.localDescription?.sdp ?? '')
    peer.view.phase = 'reply'
    peer.emit()
    return peer
  }

  async acceptAnswer(code: string): Promise<void> {
    const sdp = await decodeSignal(code)
    await this.pc.setRemoteDescription({ type: 'answer', sdp })
    this.view.phase = 'connecting'
    this.emit()
  }

  submit(answer: Answer): void {
    const questionId = this.view.questionIds[this.view.index]
    if (!questionId || this.view.localSent || this.view.playPhase !== 'ask') return
    const player = this.view.role === 'host' ? 'a' : 'b'
    this.view.localSent = true
    this.view.playPhase = 'wait'
    this.transport.submit(player, questionId, answer)
    this.emit()
  }

  next(): void {
    if (this.view.role !== 'host' || this.view.playPhase !== 'reveal') return
    const nextIndex = this.view.index + 1
    if (nextIndex >= this.view.questionIds.length) return
    this.view.index = nextIndex
    this.view.playPhase = 'ask'
    this.view.localSent = false
    this.view.shown = { a: null, b: null }
    this.send({ type: 'next', index: nextIndex })
    this.emit()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  close(): void {
    this.silent = true
    this.channel?.close()
    this.pc.close()
  }

  private bindChannel(channel: RTCDataChannel): void {
    this.channel = channel
    channel.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return
      this.onMessage(event.data)
    })
    channel.addEventListener('open', () => {
      this.send({ type: 'hello', name: this.ownName })
    })
    channel.addEventListener('close', () => this.markDropped())
  }

  private onMessage(raw: string): void {
    let message: WireMessage
    try {
      message = JSON.parse(raw) as WireMessage
    } catch {
      return
    }
    if (message.type === 'hello' && typeof message.name === 'string') {
      this.onHello(message.name.slice(0, 24))
      return
    }
    if (message.type === 'round' && this.view.role === 'guest') {
      this.onRound(message)
      return
    }
    if (message.type === 'answer' && this.view.role === 'host' && isAnswer(message.answer)) {
      this.transport.receive('b', message.questionId, message.answer)
      return
    }
    if (message.type === 'reveal' && this.view.role === 'guest') {
      this.applyReveal(message)
      return
    }
    if (message.type === 'next' && this.view.role === 'guest' && Number.isInteger(message.index)) {
      this.view.index = message.index
      this.view.playPhase = 'ask'
      this.view.localSent = false
      this.view.shown = { a: null, b: null }
      this.view.winner = null
      this.emit()
    }
  }

  private onHello(name: string): void {
    if (this.view.role === 'host') {
      this.view.names = { a: this.ownName, b: name }
      this.view.phase = 'open'
      this.send({
        type: 'round',
        questionIds: this.view.questionIds,
        names: this.view.names,
        index: 0,
        score: this.view.score,
      })
      this.emit()
      return
    }
    this.view.names = { ...this.view.names, a: name }
    this.emit()
  }

  private onRound(message: RoundMessage): void {
    if (!Array.isArray(message.questionIds) || !message.names) return
    this.view.questionIds = message.questionIds.filter((id) => typeof id === 'string')
    this.view.names = {
      a: String(message.names.a ?? '').slice(0, 24),
      b: this.ownName,
    }
    this.view.index = message.index || 0
    this.view.score = message.score ?? emptyScore()
    this.view.phase = 'open'
    this.view.playPhase = 'ask'
    this.emit()
  }

  private maybeReveal(): void {
    if (this.view.role !== 'host' || this.view.playPhase === 'reveal' || this.view.playPhase === 'done') return
    const questionId = this.view.questionIds[this.view.index]
    const question = questionId ? questionById(questionId) : undefined
    if (!question || !this.transport.bothAnswered(question.id)) return
    const answerA = this.transport.answerFor('a', question.id)
    const answerB = this.transport.answerFor('b', question.id)
    if (!answerA || !answerB) return
    const scoredA = scoreResponse(question, answerA, this.view.score.streak.a)
    const scoredB = scoreResponse(question, answerB, this.view.score.streak.b)
    const score: ScoreSnap = {
      hearts: {
        a: Math.max(0, this.view.score.hearts.a - (scoredA.correct ? 0 : 1)),
        b: Math.max(0, this.view.score.hearts.b - (scoredB.correct ? 0 : 1)),
      },
      xp: { a: this.view.score.xp.a + scoredA.xp, b: this.view.score.xp.b + scoredB.xp },
      streak: { a: scoredA.streak, b: scoredB.streak },
      correct: {
        a: this.view.score.correct.a + (scoredA.correct ? 1 : 0),
        b: this.view.score.correct.b + (scoredB.correct ? 1 : 0),
      },
    }
    const finished = score.hearts.a === 0 || score.hearts.b === 0 || this.view.index + 1 >= this.view.questionIds.length
    const winner = finished ? winnerOf(score) : null
    this.view.score = score
    this.view.shown = { a: answerA, b: answerB }
    this.view.winner = winner
    this.view.playPhase = finished ? 'done' : 'reveal'
    this.send({
      type: 'reveal',
      questionId: question.id,
      answers: { a: answerA, b: answerB },
      score,
      finished,
      winner,
    })
    this.emit()
  }

  private applyReveal(message: RevealMessage): void {
    if (!isAnswer(message.answers?.a) || !isAnswer(message.answers?.b)) return
    this.view.shown = message.answers
    this.view.score = message.score ?? this.view.score
    this.view.winner = message.finished ? message.winner : null
    this.view.playPhase = message.finished ? 'done' : 'reveal'
    this.emit()
  }

  private send(message: WireMessage): void {
    if (!this.channel || this.channel.readyState !== 'open') return
    this.channel.send(JSON.stringify(message))
  }

  private markDropped(): void {
    if (this.silent || this.view.dropped) return
    this.view.dropped = true
    this.view.phase = 'closed'
    this.emit()
  }

  private emit(): void {
    this.revision += 1
    for (const listener of this.listeners) listener()
  }
}

function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    function done() {
      if (pc.iceGatheringState !== 'complete') return
      pc.removeEventListener('icegatheringstatechange', done)
      resolve()
    }
    pc.addEventListener('icegatheringstatechange', done)
    if (pc.iceGatheringState === 'complete') done()
  })
}

export { SignalError }
