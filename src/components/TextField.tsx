import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** Unit or icon shown inside the field on the right (e.g. "kg", a calendar icon for dates). */
  suffix?: ReactNode
  hint?: string
}

/** Figma TextField (33:3900): label above a pressed (inset) field. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, suffix, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn('flex w-full flex-col gap-02', className)}>
      <label htmlFor={inputId} className="text-label text-text">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-02 rounded-02 bg-surface px-04 py-03 shadow-pressed',
          'focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-focus',
        )}
      >
        <input
          ref={ref}
          id={inputId}
          aria-describedby={hintId}
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-muted"
          {...rest}
        />
        {suffix && <span className="text-body text-text-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
    </div>
  )
})
