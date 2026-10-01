import type { Progress } from '../../types/progress.ts'

export type BadgeId =
  | 'selector-rookie'
  | 'specificity-fighter'
  | 'id-hunter'
  | 'cascade-master'
  | 'css-wizard'
  | 'important-survivor'

export type Badge = {
  id: BadgeId
  name: string
  detail: string
  earned: boolean
  locked: boolean
}

export function evaluateBadges(progress: Progress): Badge[] {
  const stars = (level: number) => progress.levels[level]?.bestStars ?? 0
  return [
    {
      id: 'selector-rookie',
      name: 'Selector Rookie',
      detail: 'Eén ster op level 1.',
      earned: stars(1) >= 1,
      locked: false,
    },
    {
      id: 'specificity-fighter',
      name: 'Specificity Fighter',
      detail: 'Een reeks van vijf goede antwoorden.',
      earned: progress.bestStreak >= 5,
      locked: false,
    },
    {
      id: 'id-hunter',
      name: 'ID Hunter',
      detail: 'Twee sterren op level 2.',
      earned: stars(2) >= 2,
      locked: false,
    },
    {
      id: 'cascade-master',
      name: 'Cascade Master',
      detail: 'Eén ster op level 5.',
      earned: stars(5) >= 1,
      locked: false,
    },
    {
      id: 'css-wizard',
      name: 'CSS Wizard',
      detail: 'Eén ster op Cascade layers.',
      earned: stars(7) >= 1,
      locked: false,
    },
    {
      id: 'important-survivor',
      name: '!important Survivor',
      detail: 'Eén ster op !important.',
      earned: stars(6) >= 1,
      locked: false,
    },
  ]
}
