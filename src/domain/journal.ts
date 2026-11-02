import { daysBetween } from './dates'
import { nutrientsForGrams, roundNutrients, scaleNutrients, sumNutrients } from './nutrition'
import type { IsoDate, MacroTargets, MealSlot, Nutrients } from './types'

/** Index (0-based) of `today` in a plan starting on `startDate`, or null when today is outside the plan. */
export function planDayIndex(startDate: IsoDate, days: number, today: IsoDate): number | null {
  const index = daysBetween(startDate, today)
  return index >= 0 && index < days ? index : null
}

/** Slot proposed for a quick add, from the hour of the day. */
export function defaultSlot(hour: number): MealSlot {
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

/** Nutrients of `portions` servings of a recipe (values per serving), rounded for the journal. */
export function recipeEntryNutrients(perServing: Nutrients, portions: number): Nutrients {
  return roundNutrients(scaleNutrients(perServing, portions))
}

/** Nutrients of `grams` of a food (values per 100 g), rounded for the journal. */
export function foodEntryNutrients(per100g: Nutrients, grams: number): Nutrients {
  return roundNutrients(nutrientsForGrams(per100g, grams))
}

/** Total of a day's journal entries. */
export function dayNutrients(entries: ReadonlyArray<{ nutrients: Nutrients }>): Nutrients {
  return roundNutrients(sumNutrients(entries.map((entry) => entry.nutrients)))
}

export type MacroProgress = { key: keyof MacroTargets; eaten: number; target: number }

/** Protein, carbs and fat eaten against their targets, in the order shown on screen. */
export function macroProgress(eaten: Nutrients, targets: MacroTargets): MacroProgress[] {
  return [
    { key: 'proteinG', eaten: eaten.protein, target: targets.proteinG },
    { key: 'carbsG', eaten: eaten.carbs, target: targets.carbsG },
    { key: 'fatG', eaten: eaten.fat, target: targets.fatG },
  ]
}
