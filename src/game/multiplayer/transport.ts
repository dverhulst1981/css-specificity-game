import type { Answer } from '../../types/question.ts'

export type PlayerId = 'a' | 'b'

export type MatchTransportKind = 'local-pass' | 'remote'

export interface MatchTransport {
  readonly kind: MatchTransportKind
  submit(player: PlayerId, questionId: string, answer: Answer): void
  answerFor(player: PlayerId, questionId: string): Answer | null
  bothAnswered(questionId: string): boolean
}

export function createTransport(kind: MatchTransportKind): MatchTransport {
  if (kind === 'local-pass') return new LocalPassTransport()
  throw new Error('Remote transport is nog geen ronde')
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
