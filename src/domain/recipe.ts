/**
 * Factor applied to a recipe's grams (written for `servings` servings) to cook the plan's dish
 * for the whole household: plan scale × people ÷ servings.
 */
export function recipeScale(servings: number, planScale: number, householdSize: number): number {
  return (planScale * householdSize) / servings
}

/** Grams of an ingredient once scaled, rounded the way a kitchen scale reads: 1 g under 10 g, else 5 g. */
export function scaledIngredientGrams(grams: number, scale: number): number {
  const value = grams * scale
  if (value < 10) return Math.max(1, Math.round(value))
  return Math.round(value / 5) * 5
}

/** The recipe's own household wording ("2 œufs") only stays true close to its original quantity. */
export function keepsOriginalWording(scale: number): boolean {
  return Math.abs(scale - 1) <= 0.12
}
