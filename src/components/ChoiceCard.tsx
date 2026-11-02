import { useId, type ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type Choice<T extends string> = {
  value: T
  title: string
  description?: string
  icon?: IconName
}

export type ChoiceCardsProps<T extends string> = {
  /** Visible group label. */
  legend: ReactNode
  choices: ReadonlyArray<Choice<T>>
  value: T | null
  onChange: (value: T) => void
  className?: string
}

/**
 * Exclusive choice shown as OptionCards (Figma 33:3800 style). Native radios, so arrows and
 * Tab work as expected. Selected = pressed card with a check.
 */
export function ChoiceCards<T extends string>({ legend, choices, value, onChange, className }: ChoiceCardsProps<T>) {
  const name = useId()

  return (
    <fieldset className={cn('flex flex-col gap-03', className)}>
      <legend className="mb-03 text-title-3 text-text">{legend}</legend>
      {choices.map((choice) => {
        const selected = choice.value === value
        return (
          <label
            key={choice.value}
            className={cn(
              'flex cursor-pointer items-center gap-04 rounded-03 bg-surface p-04',
              'transition-shadow duration-[var(--duration-fast)] ease-out',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus',
              selected ? 'shadow-pressed' : 'shadow-raised hover:shadow-raised-sm',
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={selected}
              onChange={() => onChange(choice.value)}
              className="sr-only"
            />
            {choice.icon && (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-pressed">
                <Icon name={choice.icon} size={24} />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-01">
              <span className={cn('text-label', selected ? 'text-focus-text' : 'text-text')}>{choice.title}</span>
              {choice.description && <span className="text-body-sm text-text-muted">{choice.description}</span>}
            </span>
            <span
              aria-hidden
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full',
                selected ? 'bg-focus text-on-primary' : 'bg-surface shadow-pressed',
              )}
            >
              {selected && <Icon name="check" size={16} />}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
