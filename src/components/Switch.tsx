import { useId } from 'react'
import { cn } from './cn'

export type SwitchProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  disabled?: boolean
  className?: string
}

/** Figma Switch (33:3913): immediate setting, always with a label on the left. */
export function Switch({ label, checked, onChange, description, disabled, className }: SwitchProps) {
  const id = useId()

  return (
    <div className={cn('flex min-h-11 items-center gap-04', className)}>
      <div className="flex flex-1 flex-col">
        <label htmlFor={id} className="text-body text-text">
          {label}
        </label>
        {description && <span className="text-caption text-text-muted">{description}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative flex h-7 w-12 shrink-0 items-center rounded-full px-01 before:absolute before:-inset-2',
          'transition-colors duration-[var(--duration-fast)] ease-out disabled:opacity-50',
          checked ? 'justify-end bg-focus' : 'justify-start bg-surface shadow-pressed',
        )}
      >
        <span
          aria-hidden
          className={cn('size-5 rounded-full', checked ? 'bg-on-primary' : 'bg-surface shadow-raised-sm')}
        />
      </button>
    </div>
  )
}
