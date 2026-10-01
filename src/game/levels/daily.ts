import type { Question } from '../../types/question.ts'
import { mulberry32 } from '../engine/generator.ts'

export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function hashSeed(key: string): number {
  let hash = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function dailyQuestions(bank: Question[], isoDate: string): Question[] {
  const rng = mulberry32(hashSeed(isoDate))
  const copy = [...bank]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const current = copy[i]!
    copy[i] = copy[j]!
    copy[j] = current
  }
  return copy.slice(0, 5)
}
