import type { IndexedRecipe } from '../../data/reference'
import type { Nutrients } from '../../domain/types'

/** What the recipe screens show: the dish as planned for the person. */
export type RecipeView = {
  recipe: IndexedRecipe
  /** Nutrition of the dish eaten by one person (the plan's scale applied). */
  nutrition: Nutrients
  /** Factor for the ingredient list (plan scale × household ÷ recipe servings). */
  scale: number
  householdSize: number
}
