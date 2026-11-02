import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type OptionCardProps = {
  title: string
  description?: string
  icon?: IconName
  /** Custom visual in the inset badge (e.g. a ClayIcon). Takes precedence over icon. */
  visual?: ReactNode
  /** When set, the card is a button with a chevron. Without it, it is plain information. */
  onClick?: () => void
  className?: string
}

/** Figma OptionCard (33:3800). */
export function OptionCard({ title, description, icon, visual, onClick, className }: OptionCardProps) {
  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-pressed">
        {visual ?? (icon && <Icon name={icon} size={24} />)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-01 text-left">
        <span className="text-label text-text">{title}</span>
        {description && <span className="text-body-sm text-text-muted">{description}</span>}
      </span>
      {onClick && <Icon name="chevron-right" size={20} className="text-text" />}
    </>
  )

  const base = 'flex w-full items-center gap-04 rounded-03 bg-surface p-04 shadow-raised'

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, 'transition-shadow duration-[var(--duration-fast)] active:shadow-pressed', className)}
    >
      {content}
    </button>
  ) : (
    <div className={cn(base, className)}>{content}</div>
  )
}
