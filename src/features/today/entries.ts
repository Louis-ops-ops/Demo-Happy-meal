import { planKey, type JournalEntry, type PlanMealRow } from '../../data/db'
import type { IndexedRecipe } from '../../data/reference'
import { recipeEntryNutrients } from '../../domain/journal'
import type { IsoDate } from '../../domain/types'

/** The journal entry created when a planned meal is ticked as eaten. */
export function planMealEntry(
  meal: PlanMealRow,
  recipe: IndexedRecipe,
  date: IsoDate,
): JournalEntry & { planKey: string } {
  return {
    date,
    slot: meal.slot,
    label: recipe.title,
    kind: 'plan',
    recipeId: recipe.id,
    quantity: meal.portions,
    nutrients: recipeEntryNutrients(recipe.nutrition, meal.portions),
    planKey: planKey(meal.planId, meal.day, meal.index),
  }
}
