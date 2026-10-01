export type LevelInfo = {
  level: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  blurb: string
}

export const MAX_LEVEL = 6

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: 'Elementen',
    blurb: 'Een element telt als één. Een klasse telt als één. De vier cijfers blijven apart.',
  },
  {
    level: 2,
    name: 'ID en attributen',
    blurb: 'Een id verslaat een handvol klassen. Een attribuut telt als een klasse.',
  },
  {
    level: 3,
    name: "Pseudo's",
    blurb: ':hover is een klasse. ::before is een element.',
  },
  {
    level: 4,
    name: ':is, :not, :where',
    blurb: ':is en :not nemen het sterkste argument. :where neemt niets, ook niet wat erin staat.',
  },
  {
    level: 5,
    name: 'De cascade kiest',
    blurb: 'Bij een gelijke specificity waarde wint de latere regel. Niet eerder.',
  },
  {
    level: 6,
    name: '!important',
    blurb: '!important wint van een zwaardere selector. Pas daarna telt de specificity waarde weer.',
  },
]

export function levelInfo(level: number): LevelInfo | undefined {
  return LEVELS.find((item) => item.level === level)
}
