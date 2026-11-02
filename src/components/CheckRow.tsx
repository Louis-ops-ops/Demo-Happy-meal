import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

export type CheckRowProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Leading visual, usually a 40 px ClayIcon. */
  visual?: ReactNode
  /** Secondary text on the right, e.g. a quantity. */
  detail?: string
  className?: string
}

/** Figma CheckRow (33:3870): checkable row for multi-selection in lists (shopping list, search). */
export function CheckRow({ label, checked, onChange, visual, detail, className }: CheckRowProps) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-center gap-03 py-02', className)}>
      {visual}
      <span className={cn('flex-1 text-body', checked ? 'text-text-muted' : 'text-text')}>{label}</span>
      {detail && <span className="text-body-sm text-text-muted">{detail}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus',
          checked ? 'bg-focus text-on-primary' : 'bg-surface shadow-pressed',
        )}
      >
        {checked && <Icon name="check" size={16} />}
      </span>
    </label>
  )
}
