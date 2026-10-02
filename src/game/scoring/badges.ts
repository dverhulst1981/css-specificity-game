import type { Progress } from '../../types/progress.ts'

export type BadgeId =
  | 'element-scout'
  | 'selector-rookie'
  | 'id-hunter'
  | 'cascade-master'
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
      id: 'element-scout',
      name: 'Element Scout',
      detail: 'Drie sterren op Wie wordt er geselecteerd.',
      earned: stars(1) >= 3,
      locked: false,
    },
    {
      id: 'selector-rookie',
      name: 'Selector Rookie',
      detail: 'Twee sterren op Elementen.',
      earned: stars(2) >= 2,
      locked: false,
    },
    {
      id: 'id-hunter',
      name: 'ID Hunter',
      detail: 'Twee sterren op level 3.',
      earned: stars(3) >= 2,
      locked: false,
    },
    {
      id: 'cascade-master',
      name: 'Cascade Master',
      detail: 'Twee sterren op level 6.',
      earned: stars(6) >= 2,
      locked: false,
    },
    {
      id: 'important-survivor',
      name: '!important Survivor',
      detail: 'Twee sterren op !important.',
      earned: stars(7) >= 2,
      locked: false,
    },
  ]
}
