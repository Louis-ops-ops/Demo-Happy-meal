import { cn } from './cn'

export type ProgressBarProps = {
  value: number
  max: number
  /** Accessible name, e.g. "Calories du jour". */
  label: string
  /** Human readable value for screen readers, e.g. "740 sur 2 000 kcal". */
  valueText?: string
  className?: string
}

/**
 * Figma "Progression" bar (H1 Journée): inset track, color-focus fill.
 * Going over the target never turns red: the bar just stays full (no guilt, see CLAUDE.md).
 */
export function ProgressBar({ value, max, label, valueText, className }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface shadow-pressed', className)}
    >
      <div
        className="h-full rounded-full bg-focus transition-[width] duration-500 ease-out"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}
