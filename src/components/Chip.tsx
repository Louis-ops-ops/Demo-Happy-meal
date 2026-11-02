import type { ButtonHTMLAttributes } from 'react'
import type { ClayId } from './clay'
import { ClayIcon } from './ClayIcon'
import { cn } from './cn'

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  selected?: boolean
  /** Turns the chip into Figma IllustratedChip (clay food or equipment). */
  clay?: ClayId
}

/** Figma Chip (20:2903) and IllustratedChip (32:3161): multi-select toggle. */
export function Chip({ label, selected = false, clay, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center rounded-full bg-surface text-body-sm whitespace-nowrap',
        'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
        clay ? 'gap-02 py-01 pr-04 pl-01' : 'h-9 justify-center px-04',
        selected ? 'text-focus-text shadow-pressed' : 'text-text shadow-raised-sm',
        className,
      )}
      {...rest}
    >
      {clay && <ClayIcon id={clay} size={24} />}
      {label}
    </button>
  )
}
