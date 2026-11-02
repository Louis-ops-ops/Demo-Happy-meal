import { cn } from './cn'
import { IconButton } from './IconButton'

export type StepperProps = {
  /** Accessible name, e.g. "Personnes". */
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

/** Figma Stepper (29:1335): whole quantity with raised minus / plus buttons. Minimum 1 by default. */
export function Stepper({ label, value, onChange, min = 1, max = 99, className }: StepperProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-03', className)}>
      <IconButton icon="minus" label={`Moins : ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} />
      <output aria-live="polite" className="w-8 text-center text-title-2 text-text">
        {value}
      </output>
      <IconButton icon="plus" label={`Plus : ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} />
    </div>
  )
}
