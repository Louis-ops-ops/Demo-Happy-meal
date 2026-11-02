import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Raised = default card. Pressed = inset well. Flat = no relief, for large desktop surfaces. */
  relief?: 'raised' | 'pressed' | 'flat'
}

const reliefs = {
  raised: 'shadow-raised',
  pressed: 'shadow-pressed',
  flat: '',
}

/** Neumorphic surface (Figma "Bilan du jour" card): radius-lg, padding spacing-05. */
export function Card({ relief = 'raised', className, ...rest }: CardProps) {
  return <div className={cn('rounded-03 bg-surface p-05', reliefs[relief], className)} {...rest} />
}
