import { cn } from './cn'

export type GaugeProps = {
  value: number
  target: number
  /** Accessible name, e.g. "Calories du jour". */
  label: string
  /** Unit after the target, e.g. "kcal". */
  unit: string
  /** Pixel size of the ring (it scales down with its container). */
  size?: number
  className?: string
}

const formatter = new Intl.NumberFormat('fr-FR')

/**
 * Ring gauge for the desktop dashboards (no Figma equivalent yet, built from the kit:
 * raised disc, inset well, color-focus arc, display / caption text).
 * Over the target the ring stays full and the copy stays neutral: never red.
 */
export function Gauge({ value, target, label, unit, size = 220, className }: GaugeProps) {
  const ratio = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const remaining = Math.round(target - value)

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${formatter.format(Math.round(value))} sur ${formatter.format(target)} ${unit}`}
      className={cn('relative aspect-square w-full rounded-full bg-surface p-04 shadow-raised', className)}
      style={{ maxWidth: size }}
    >
      <div className="relative size-full rounded-full shadow-pressed">
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            className="text-focus transition-[stroke-dashoffset] duration-700 ease-out"
            style={{ opacity: ratio > 0 ? 1 : 0 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-display text-text">{formatter.format(Math.round(value))}</span>
          <span className="text-caption text-text-muted">
            sur {formatter.format(target)} {unit}
          </span>
          <span className="mt-01 text-caption text-text-muted">
            {remaining >= 0 ? `encore ${formatter.format(remaining)}` : 'objectif atteint'}
          </span>
        </div>
      </div>
    </div>
  )
}
