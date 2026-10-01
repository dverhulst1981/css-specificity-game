import type { Answer } from '../../types/question.ts'

export type PlayerId = 'a' | 'b'

export type MatchTransportKind = 'local-pass' | 'remote'

export interface MatchTransport {
  readonly kind: MatchTransportKind
  submit(player: PlayerId, questionId: string, answer: Answer): void
  answerFor(player: PlayerId, questionId: string): Answer | null
  bothAnswered(questionId: string): boolean
}

export type AnswerWire = {
  type: 'answer'
  questionId: string
  answer: Answer
}

export type RemoteLink = {
  role: PlayerId
  send(message: AnswerWire): void
}

export function createTransport(kind: 'local-pass'): LocalPassTransport
export function createTransport(kind: 'remote', link: RemoteLink): RemoteTransport
export function createTransport(kind: MatchTransportKind, link?: RemoteLink): MatchTransport {
  if (kind === 'local-pass') return new LocalPassTransport()
  if (!link) throw new Error('Remote transport heeft een kanaal nodig')
  return new RemoteTransport(link)
}

export class LocalPassTransport implements MatchTransport {
  readonly kind = 'local-pass' as const
  private readonly answers = new Map<string, Answer>()

  submit(player: PlayerId, questionId: string, answer: Answer): void {
    this.answers.set(`${player}:${questionId}`, answer)
  }

  answerFor(player: PlayerId, questionId: string): Answer | null {
    return this.answers.get(`${player}:${questionId}`) ?? null
  }

  bothAnswered(questionId: string): boolean {
    return this.answerFor('a', questionId) !== null && this.answerFor('b', questionId) !== null
  }
}

export class RemoteTransport implements MatchTransport {
  readonly kind = 'remote' as const
  private readonly answers = new Map<string, Answer>()
  private readonly listeners = new Set<() => void>()
  private readonly link: RemoteLink

  constructor(link: RemoteLink) {
    this.link = link
  }

  submit(player: PlayerId, questionId: string, answer: Answer): void {
    this.answers.set(`${player}:${questionId}`, answer)
    if (player === 'b' && this.link.role === 'b') this.link.send({ type: 'answer', questionId, answer })
    this.emit()
  }

  receive(player: PlayerId, questionId: string, answer: Answer): void {
    this.answers.set(`${player}:${questionId}`, answer)
    this.emit()
  }

  answerFor(player: PlayerId, questionId: string): Answer | null {
    return this.answers.get(`${player}:${questionId}`) ?? null
  }

  bothAnswered(questionId: string): boolean {
    return this.answerFor('a', questionId) !== null && this.answerFor('b', questionId) !== null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
