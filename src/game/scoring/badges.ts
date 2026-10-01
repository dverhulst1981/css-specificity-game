import type { Progress } from '../../types/progress.ts'

export type BadgeId =
  | 'selector-rookie'
  | 'id-hunter'
  | 'cascade-master'
  | 'important-survivor'
  | 'element-scout'

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
      id: 'id-hunter',
      name: 'ID Hunter',
      detail: 'Twee sterren op level 3.',
      earned: stars(3) >= 2,
      locked: false,
    },
    {
      id: 'cascade-master',
      name: 'Cascade Master',
      detail: 'Eén ster op level 6.',
      earned: stars(6) >= 1,
      locked: false,
    },
    {
      id: 'important-survivor',
      name: '!important Survivor',
      detail: 'Eén ster op !important.',
      earned: stars(7) >= 1,
      locked: false,
    },
    {
      id: 'element-scout',
      name: 'Element Scout',
      detail: '9 van de 10 goed in één ronde Wie wordt er geselecteerd.',
      earned: stars(1) >= 2,
      locked: false,
    },
  ]
}
