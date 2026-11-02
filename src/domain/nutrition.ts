import type { Nutrients } from './types'

export const ZERO_NUTRIENTS: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }

function mapNutrients(n: Nutrients, fn: (value: number) => number): Nutrients {
  return {
    kcal: fn(n.kcal),
    protein: fn(n.protein),
    carbs: fn(n.carbs),
    fat: fn(n.fat),
    fiber: fn(n.fiber),
    salt: fn(n.salt),
  }
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return mapNutrients(n, (value) => value * factor)
}

export function sumNutrients(list: ReadonlyArray<Nutrients>): Nutrients {
  return list.reduce<Nutrients>(
    (total, n) => ({
      kcal: total.kcal + n.kcal,
      protein: total.protein + n.protein,
      carbs: total.carbs + n.carbs,
      fat: total.fat + n.fat,
      fiber: total.fiber + n.fiber,
      salt: total.salt + n.salt,
    }),
    ZERO_NUTRIENTS,
  )
}

/** Nutrients of `grams` of a food given per 100 g. */
export function nutrientsForGrams(per100g: Nutrients, grams: number): Nutrients {
  return scaleNutrients(per100g, grams / 100)
}

export type RecipeIngredient = {
  /** Food values per 100 g. */
  per100g: Nutrients
  grams: number
}

/**
 * Nutrition of one serving: Σ (value per 100 g × grams / 100) ÷ servings.
 * Always computed from ingredients, never typed by hand.
 */
export function recipeNutritionPerServing(
  ingredients: ReadonlyArray<RecipeIngredient>,
  servings: number,
): Nutrients {
  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error(`A recipe needs at least one serving (got ${servings})`)
  }
  const total = sumNutrients(ingredients.map((i) => nutrientsForGrams(i.per100g, i.grams)))
  return scaleNutrients(total, 1 / servings)
}

/** Rounds for display: kcal to the unit, grams to 0.1 (salt to 0.01). */
export function roundNutrients(n: Nutrients): Nutrients {
  const r = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals
  return {
    kcal: Math.round(n.kcal),
    protein: r(n.protein, 1),
    carbs: r(n.carbs, 1),
    fat: r(n.fat, 1),
    fiber: r(n.fiber, 1),
    salt: r(n.salt, 2),
  }
}
