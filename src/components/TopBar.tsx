import type { ReactNode } from 'react'
import { cn } from './cn'
import { IconButton } from './IconButton'

export type TopBarProps = {
  title: string
  /** Back by default; "close" shows a cross for full-screen flows. */
  leading?: 'back' | 'close'
  onLeading?: () => void
  /** Optional right action (e.g. favorite IconButton). */
  trailing?: ReactNode
  className?: string
}

/** Figma TopBar (29:1298): pushed screens only, not tab screens. */
export function TopBar({ title, leading = 'back', onLeading, trailing, className }: TopBarProps) {
  return (
    <header className={cn('flex items-center gap-03 bg-surface px-05 py-02', className)}>
      {onLeading ? (
        <IconButton
          icon={leading === 'back' ? 'back' : 'x'}
          label={leading === 'back' ? 'Retour' : 'Fermer'}
          onClick={onLeading}
        />
      ) : (
        <span className="size-10" />
      )}
      <h1 className="flex-1 text-center text-title-3 text-text">{title}</h1>
      <div className="flex size-10 items-center justify-center">{trailing}</div>
    </header>
  )
}
