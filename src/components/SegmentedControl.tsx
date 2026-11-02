import { useRef, type KeyboardEvent } from 'react'
import { cn } from './cn'

export type SegmentedOption<T extends string> = { value: T; label: string }

export type SegmentedControlProps<T extends string> = {
  label: string
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Figma SegmentedControl (33:3899): exclusive choice between short options, also used as tabs. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    const option = options[next]
    if (!option) return
    onChange(option.value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex w-full items-center gap-01 rounded-full bg-surface p-01 shadow-pressed', className)}
    >
      {options.map((option, index) => {
        const active = option.value === value
        // With nothing selected yet, the first option stays reachable with Tab.
        const focusable = active || (index === 0 && !options.some((o) => o.value === value))
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={focusable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'min-h-10 flex-1 rounded-full px-03 py-02 text-label whitespace-nowrap',
              'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
              active ? 'bg-surface text-text shadow-raised-sm' : 'text-text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
