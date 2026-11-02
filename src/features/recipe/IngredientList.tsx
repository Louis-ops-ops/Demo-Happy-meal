import { ClayIcon } from '../../components/ClayIcon'
import { clayForText } from '../../components/clay'
import type { IndexedRecipe } from '../../data/reference'
import { keepsOriginalWording, scaledIngredientGrams } from '../../domain/recipe'
import { formatShoppingQuantity } from '../../domain/shopping'
import { normalize } from '../../domain/text'

export type IngredientListProps = {
  recipe: IndexedRecipe
  /** Factor from `recipeScale`: the list shows the quantities to cook, not the recipe's base ones. */
  scale: number
}

/** Ingredients of the dish as planned for the person (and the household). */
export function IngredientList({ recipe, scale }: IngredientListProps) {
  return (
    <ul className="flex flex-col rounded-03 bg-surface px-04 py-02 shadow-raised">
      {recipe.ingredients.map((ingredient) => {
        const clay = clayForText(normalize(ingredient.label))
        const detail =
          ingredient.display && keepsOriginalWording(scale)
            ? ingredient.display
            : formatShoppingQuantity(scaledIngredientGrams(ingredient.grams, scale))
        return (
          <li key={`${ingredient.foodId}-${ingredient.label}`} className="flex min-h-14 items-center gap-03 py-02">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-darkgreen-200">
              {clay && <ClayIcon id={clay} size={32} />}
            </span>
            <span className="flex-1 text-body text-text first-letter:uppercase">{ingredient.label}</span>
            <span className="text-body-sm text-text-muted">{detail}</span>
          </li>
        )
      })}
    </ul>
  )
}
