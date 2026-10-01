import type { MouseEvent, ReactNode } from 'react'
import { publicPath } from '../base.ts'
import { useApp } from '../app-context.tsx'

export function Shell({ children }: { children: ReactNode }) {
  const { navigate, path, persistent } = useApp()

  function go(event: MouseEvent<HTMLAnchorElement>, next: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(next)
  }

  return (
    <>
      <header className="top">
        <a className="wordmark" href={publicPath('/')} aria-label="Selector Wars" onClick={(event) => go(event, '/')}>
          <span className="logo" aria-hidden="true">
            ⚔️
          </span>
          Selector Wars
        </a>
        <nav>
          <a href={publicPath('/pad')} aria-current={path === '/pad' ? 'page' : undefined} onClick={(event) => go(event, '/pad')}>
            Levelpad
          </a>
          <a
            href={publicPath('/voortgang')}
            aria-current={path === '/voortgang' ? 'page' : undefined}
            onClick={(event) => go(event, '/voortgang')}
          >
            Voortgang
          </a>
        </nav>
      </header>
      {!persistent ? <p className="notice">Deze browser bewaart je ronde niet.</p> : null}
      <main>{children}</main>
    </>
  )
}
