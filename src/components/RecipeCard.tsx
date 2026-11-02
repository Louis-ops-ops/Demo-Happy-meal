import type { ReactNode } from 'react'
import type { ClayId } from './clay'
import { ClayIcon } from './ClayIcon'
import { cn } from './cn'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

export type RecipeCardProps = {
  title: string
  /** e.g. "25 min · 420 kcal" */
  meta: string
  clay?: ClayId
  favorite?: boolean
  onToggleFavorite?: () => void
  /** Makes the whole card open the recipe. */
  onOpen?: () => void
  /** Replaces the favorite button (e.g. a "mangé" check on Today). */
  action?: ReactNode
  className?: string
}

/** Figma RecipeCard (20:2909). */
export function RecipeCard({
  title,
  meta,
  clay,
  favorite = false,
  onToggleFavorite,
  onOpen,
  action,
  className,
}: RecipeCardProps) {
  return (
    <article
      className={cn(
        'relative flex items-center gap-03 rounded-03 bg-surface p-04 shadow-raised',
        onOpen && 'transition-shadow duration-[var(--duration-fast)] hover:shadow-raised-sm',
        className,
      )}
    >
      <div className="flex size-16 shrink-0 items-center justify-center rounded-02 bg-lightbrown-p">
        {clay ? <ClayIcon id={clay} size={48} /> : <Icon name="cooking-pot" size={24} className="text-text-muted" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-01">
        <h3 className="text-title-3 text-text">
          {onOpen ? (
            // Stretched link: the button's ::after covers the card, the favorite stays above it.
            <button
              type="button"
              onClick={onOpen}
              className="text-left after:absolute after:inset-0 after:rounded-03 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-focus"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h3>
        <p className="flex items-start gap-01 text-body-sm text-text-muted">
          <Icon name="clock" size={16} className="mt-[1px]" />
          {meta}
        </p>
      </div>
      <div className="relative z-10">
        {action ??
          (onToggleFavorite && (
            <IconButton
              icon={favorite ? 'heart-filled' : 'heart'}
              label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              pressed={favorite}
              pressedClassName="text-accent"
              onClick={onToggleFavorite}
            />
          ))}
      </div>
    </article>
  )
}
