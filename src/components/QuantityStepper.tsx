import { cn } from './cn'
import { Icon } from './Icon'

export type QuantityStepperProps = {
  /** Accessible name of the quantity, e.g. "Portion". */
  label: string
  value: number
  onChange: (value: number) => void
  /** Displayed value, e.g. "1,5 portion" or "150 g". */
  format?: (value: number) => string
  min?: number
  max?: number
  step?: number
  className?: string
}

/** Figma QuantityStepper (68:921): compact flat stepper for quick forms. */
export function QuantityStepper({
  label,
  value,
  onChange,
  format = String,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  className,
}: QuantityStepperProps) {
  const round = (n: number) => Math.round(n * 100) / 100
  const buttonClass =
    'relative flex size-7 items-center justify-center rounded-full bg-lightgreen-200 text-text before:absolute before:-inset-2 disabled:text-disabled'

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex h-9 items-center gap-02 rounded-full bg-surface px-01', className)}
    >
      <button
        type="button"
        aria-label={`Diminuer : ${label}`}
        disabled={value <= min}
        onClick={() => onChange(round(Math.max(min, value - step)))}
        className={buttonClass}
      >
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite" className="min-w-12 text-center text-label text-text">
        {format(value)}
      </output>
      <button
        type="button"
        aria-label={`Augmenter : ${label}`}
        disabled={value >= max}
        onClick={() => onChange(round(Math.min(max, value + step)))}
        className={buttonClass}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
