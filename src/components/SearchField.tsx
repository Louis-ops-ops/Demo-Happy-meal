import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

export type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Accessible name; the placeholder alone is not enough. */
  label: string
}

/** Figma SearchField (20:2904): pressed (inset) field, full width in screens. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, className, placeholder = 'Rechercher un aliment', ...rest },
  ref,
) {
  return (
    <label
      className={cn(
        'flex h-12 w-full items-center gap-02 rounded-02 bg-surface px-04 text-text shadow-pressed',
        'focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-focus',
        className,
      )}
    >
      <Icon name="search" size={20} />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-muted"
        {...rest}
      />
    </label>
  )
})
