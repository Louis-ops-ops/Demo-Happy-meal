import { cn } from './cn'

export type MacroStatProps = {
  /** e.g. "62 g" */
  value: string
  /** e.g. "Protéines" */
  label: string
  /** Optional target, shown under the label, e.g. "sur 120 g". */
  target?: string
  className?: string
}

/** Figma MacroStat (29:1332): one nutrition value in an inset well. Use 3 or 4 per row, each filling. */
export function MacroStat({ value, label, target, className }: MacroStatProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-01 rounded-02 bg-surface px-02 py-03 shadow-pressed',
        className,
      )}
    >
      <span className="text-title-3 whitespace-nowrap text-text">{value}</span>
      <span className="text-caption text-text-muted">{label}</span>
      {target && <span className="text-caption text-text-muted">{target}</span>}
    </div>
  )
}
