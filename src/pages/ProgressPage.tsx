import { useApp } from '../app-context.tsx'
import { LEVELS } from '../game/levels/catalog.ts'
import { evaluateBadges } from '../game/scoring/badges.ts'
import { Lock, Star, Stars } from '../components/Icons.tsx'

export function ProgressPage() {
  const { progress } = useApp()
  const badges = evaluateBadges(progress)
  const earned = badges.some((badge) => badge.earned)

  return (
    <div className="page">
      <div className="progress-split">
        <section>
          <h1>Voortgang</h1>
          <p className="progress-line">
            Oefenen en leren staan op {progress.totalXp} xp. De beste reeks is {progress.bestStreak}.
          </p>
          <ol className="path">
            {LEVELS.map((level) => {
              const stats = progress.levels[level.level]
              return (
                <li key={level.level} className="station is-open">
                  <span className="disc">{level.level}</span>
                  <div>
                    <h2>{level.name}</h2>
                    <p>
                      <Stars count={stats?.bestStars ?? 0} />
                    </p>
                    <p>{stats ? `${stats.attempts} ronde${stats.attempts === 1 ? '' : 's'}` : 'Nog niet gespeeld.'}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
        <section>
          <h2 className="section-title">Badges</h2>
          {!earned ? <p className="progress-line">Nog geen badge. Drie sterren op level 1 openen de eerste.</p> : null}
          <ul className="badge-list">
            {badges.map((badge) => (
              <li key={badge.id} className={badge.locked ? 'is-locked' : badge.earned ? '' : 'is-waiting'}>
                <span className="disc" aria-hidden="true">
                  {badge.locked ? <Lock /> : <Star filled={badge.earned} />}
                </span>
                <div>
                  <h3>{badge.name}</h3>
                  <p>{badge.earned ? 'Binnen.' : badge.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
