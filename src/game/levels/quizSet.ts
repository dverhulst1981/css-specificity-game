import type { Question } from '../../types/question.ts'

export type LevelRange = { from: number; to: number }

export function parseSetHash(hash: string): LevelRange | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null
  const set = new URLSearchParams(raw).get('set')
  if (!set) return null
  const match = /^(\d+)(?:-(\d+))?$/.exec(set)
  if (!match) return null
  const from = Number(match[1])
  const to = match[2] ? Number(match[2]) : from
  if (from < 1 || to > 5 || from > to) return null
  return { from, to }
}

export function questionsForRange(bank: Question[], range: LevelRange): Question[] {
  return bank.filter((question) => question.level >= range.from && question.level <= range.to)
}

export function formatRange(range: LevelRange): string {
  return range.from === range.to ? String(range.from) : `${range.from}–${range.to}`
}
