import { cn } from '../../components/cn'
import { Icon } from '../../components/Icon'
import { QuantityStepper } from '../../components/QuantityStepper'
import { RecipeCard } from '../../components/RecipeCard'
import type { IndexedRecipe } from '../../data/reference'
import { formatInt } from '../format'
import { SLOT_LABELS, formatPortions } from '../plan/labels'
import { mealKcal, recipeClay } from '../plan/view'
import type { MealSlot } from '../../domain/types'

export type MealItemProps = {
  slot: MealSlot
  recipe: IndexedRecipe
  portions: number
  eaten: boolean
  onEaten: (eaten: boolean) => void
  onPortions: (portions: number) => void
}

/** A meal of today's plan: tick it as eaten, adjust the portion. */
export function MealItem({ slot, recipe, portions, eaten, onEaten, onPortions }: MealItemProps) {
  return (
    <li className="flex flex-col gap-02">
      <p className="text-overline-caps text-text-muted">{SLOT_LABELS[slot]}</p>
      <RecipeCard
        title={recipe.title}
        meta={`${recipe.minutes} min · ${formatInt(mealKcal(recipe, portions))} kcal`}
        clay={recipeClay(recipe)}
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
      <div className="flex justify-end px-02">
        <QuantityStepper
          label={`Portion : ${recipe.title}`}
          value={portions}
          min={0.5}
          max={3}
          step={0.25}
          format={formatPortions}
          onChange={onPortions}
        />
      </div>
    </li>
  )
}
