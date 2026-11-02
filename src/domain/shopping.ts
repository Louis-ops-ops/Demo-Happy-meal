export type ShoppingIngredient = { foodId: string; label: string; aisle: string; grams: number }

/** One planned meal: the recipe's ingredients (for `servings` servings) scaled by the plan's `portions`. */
export type ShoppingMeal = { servings: number; portions: number; ingredients: readonly ShoppingIngredient[] }

export type ShoppingLine = { foodId: string; label: string; aisle: string; grams: number }

/** Shopping quantities are rounded up to the next 5 g: nobody buys 37 g of rice. */
export const SHOPPING_GRAM_STEP = 5

export function roundShoppingGrams(grams: number): number {
  return Math.max(SHOPPING_GRAM_STEP, Math.ceil(grams / SHOPPING_GRAM_STEP - 1e-9) * SHOPPING_GRAM_STEP)
}

/**
 * Shopping list of a plan: ingredients summed by food over every meal, for the whole household.
 * Quantity per meal = grams ÷ recipe servings × plan portions × household size. Sorted by label.
 */
export function buildShoppingList(meals: readonly ShoppingMeal[], householdSize: number): ShoppingLine[] {
  const byFood = new Map<string, ShoppingLine>()
  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const grams = (ingredient.grams / meal.servings) * meal.portions * householdSize
      const line = byFood.get(ingredient.foodId)
      if (line) line.grams += grams
      else byFood.set(ingredient.foodId, { ...ingredient, grams })
    }
  }
  return [...byFood.values()]
    .map((line) => ({ ...line, grams: roundShoppingGrams(line.grams) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

export type AisleGroup<T> = { aisle: string; lines: T[] }

/** Lines grouped by aisle, in the order of `aisleOrder` (unknown aisles last). Empty aisles are left out. */
export function groupByAisle<T extends { aisle: string }>(lines: readonly T[], aisleOrder: readonly string[]): AisleGroup<T>[] {
  const rank = (aisle: string) => {
    const index = aisleOrder.indexOf(aisle)
    return index === -1 ? aisleOrder.length : index
  }
  const groups = new Map<string, T[]>()
  for (const line of lines) groups.set(line.aisle, [...(groups.get(line.aisle) ?? []), line])
  return [...groups.entries()].map(([aisle, list]) => ({ aisle, lines: list })).sort((a, b) => rank(a.aisle) - rank(b.aisle))
}

export type ShoppingProgress = { done: number; total: number }

/** Lines ticked in the shop or already at home count as done. */
export function shoppingProgress(
  lines: readonly { foodId: string }[],
  state: ReadonlyMap<string, { checked: boolean; atHome: boolean }>,
): ShoppingProgress {
  const done = lines.filter((line) => {
    const s = state.get(line.foodId)
    return s ? s.checked || s.atHome : false
  }).length
  return { done, total: lines.length }
}

/** "250 g", "1,2 kg" */
export function formatShoppingQuantity(grams: number): string {
  if (grams < 1000) return `${grams} g`
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(grams / 1000)} kg`
}
