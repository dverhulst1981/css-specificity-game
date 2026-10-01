import { formatSpecificity, spec, type Specificity } from '../types/specificity.ts'

const FIELDS = [
  { key: 'inline', label: 'inline' },
  { key: 'ids', label: 'ids' },
  { key: 'classes', label: 'klassen' },
  { key: 'elements', label: 'elementen' },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

export function Stepper({
  value,
  active = 0,
  onChange,
  onActivate,
}: {
  value: Specificity
  active?: number
  onChange: (next: Specificity) => void
  onActivate?: (index: number) => void
}) {
  function bump(key: FieldKey, delta: number) {
    const next = Math.min(20, Math.max(0, value[key] + delta))
    onChange({ ...value, [key]: next })
  }

  return (
    <div>
      <p className="notation" aria-live="polite">
        {formatSpecificity(value)}
      </p>
      <div className="stepper" role="group" aria-label="Specificiteit">
        {FIELDS.map((field, index) => (
          <div className={index === active ? 'step is-active' : 'step'} data-step={index} key={field.key}>
            <button
              type="button"
              data-step-dir="dec"
              aria-label={`Minder ${field.label}`}
              onFocus={() => onActivate?.(index)}
              onClick={() => {
                onActivate?.(index)
                bump(field.key, -1)
              }}
            >
              −
            </button>
            <div className="step-readout">
              <span>{field.label}</span>
              <b>{value[field.key]}</b>
            </div>
            <button
              type="button"
              data-step-dir="inc"
              aria-label={`Meer ${field.label}`}
              onFocus={() => onActivate?.(index)}
              onClick={() => {
                onActivate?.(index)
                bump(field.key, 1)
              }}
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function emptyTuple(): Specificity {
  return spec(0, 0, 0, 0)
}
