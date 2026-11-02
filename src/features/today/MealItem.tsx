import { cn } from '../../components/cn'
import { Icon } from '../../components/Icon'
import { RecipeCard } from '../../components/RecipeCard'
import type { IndexedRecipe } from '../../data/reference'
import type { MealSlot } from '../../domain/types'
import { SLOT_LABELS } from '../plan/labels'
import { mealMeta, recipeClay } from '../plan/view'

export type MealItemProps = {
  slot: MealSlot
  recipe: IndexedRecipe
  /** Scale of the recipe planned for the person (only used for the kcal shown). */
  portions: number
  eaten: boolean
  onEaten: (eaten: boolean) => void
  /** Opens the recipe page. */
  onOpen: () => void
}

/** A meal of today's plan: one dish to cook as planned, ticked once eaten. */
export function MealItem({ slot, recipe, portions, eaten, onEaten, onOpen }: MealItemProps) {
  return (
    <li className="flex flex-col gap-02">
      <p className="text-overline-caps text-text-muted">{SLOT_LABELS[slot]}</p>
      <RecipeCard
        title={recipe.title}
        meta={mealMeta(recipe, portions)}
        clay={recipeClay(recipe)}
        onOpen={onOpen}
        action={
          <button
            type="button"
            aria-pressed={eaten}
            aria-label={eaten ? `${recipe.title} : marqué comme mangé, annuler` : `Marquer comme mangé : ${recipe.title}`}
            onClick={() => onEaten(!eaten)}
            className={cn(
              'relative flex size-10 items-center justify-center rounded-full before:absolute before:-inset-0.5 before:rounded-full',
              'transition-[box-shadow,background-color,color] duration-[var(--duration-fast)] ease-out',
              eaten ? 'bg-focus text-on-primary shadow-raised-sm' : 'bg-surface text-transparent shadow-pressed',
            )}
          >
            <Icon name="check" size={20} />
          </button>
        }
      />
    </li>
  )
}
