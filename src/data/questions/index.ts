import type { Question } from '../../types/question.ts'
import { level1 } from './level-1.ts'
import { level2 } from './level-2.ts'
import { level3 } from './level-3.ts'
import { level4 } from './level-4.ts'
import { level5 } from './level-5.ts'
import { level6 } from './level-6.ts'
import { matchQuestions } from './match.ts'

export const questions: Question[] = [...level1, ...level2, ...level3, ...level4, ...level5, ...level6]

export { matchQuestions }

export function questionById(id: string): Question | undefined {
  return questions.find((question) => question.id === id) ?? matchQuestions.find((question) => question.id === id)
}
