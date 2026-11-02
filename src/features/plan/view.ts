import { clayForText, clayIds, type ClayId } from '../../components/clay'
import type { IndexedRecipe } from '../../data/reference'
import type { PlanMealRow } from '../../data/db'
import { normalize } from '../../domain/text'
import { formatInt } from '../format'

const isClayId = (id: string | undefined): id is ClayId => clayIds.includes(id as ClayId)

/** The recipe's own illustration (checked by the integrity test), else one matching its title. */
export const recipeClay = (recipe: IndexedRecipe): ClayId | undefined =>
  isClayId(recipe.clay) ? recipe.clay : clayForText(normalize(recipe.title))

export const mealKcal = (recipe: IndexedRecipe, portions: number) => recipe.nutrition.kcal * portions

/** "25 min · 520 kcal": the dish as planned for the person (quantities are already scaled, no "portion" shown). */
export const mealMeta = (recipe: IndexedRecipe, portions: number) =>
  `${recipe.minutes} min · ${formatInt(mealKcal(recipe, portions))} kcal`

export const mealsOfDay = (meals: readonly PlanMealRow[], day: number) => meals.filter((m) => m.day === day)

export function dayTotal(meals: readonly PlanMealRow[], recipes: ReadonlyMap<string, IndexedRecipe>, day: number): number {
  return mealsOfDay(meals, day).reduce((sum, m) => sum + mealKcal(recipes.get(m.recipeId)!, m.portions), 0)
}
