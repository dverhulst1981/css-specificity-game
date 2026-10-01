type IconProps = { filled?: boolean }

export function Star({ filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        d="M12 3.2 14.7 9l6.3.6-4.8 4.1 1.5 6.1L12 16.8 6.3 19.8 7.8 13.7 3 9.6 9.3 9z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Heart({ filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        d="M12 19.4 4.8 12.6A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.2 5.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Info() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function Lock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} van 3 sterren`}>
      {[0, 1, 2].map((index) => (
        <Star key={index} filled={index < count} />
      ))}
    </span>
  )
}

export function Verdict({ correct }: { correct: boolean }) {
  return (
    <span className={correct ? 'thumb is-up' : 'thumb is-down'} role="img" aria-label={correct ? 'Juist antwoord' : 'Fout antwoord'}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
        <path
          d="M8 11.2 10.4 6.6A1.6 1.6 0 0 1 13 7.4V10h4.1a1.6 1.6 0 0 1 1.6 1.8l-.7 5.8a1.6 1.6 0 0 1-1.6 1.4H8V11.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 11h2.8v7.2H5.6a1.1 1.1 0 0 1-1.1-1.1v-5A1.1 1.1 0 0 1 5.6 11z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Hearts({ count }: { count: number }) {
  return (
    <span className="hearts" aria-label={`${count} van 3 levens`}>
      {[0, 1, 2].map((index) => (
        <Heart key={index} filled={index < count} />
      ))}
    </span>
  )
}
