import type { ReferenceData } from '../../data/reference'
import { exclusionKey, isRecipeAllowed, matchesIngredient, type Diet } from '../../domain/diet'
import type { PlanRecipe } from '../../domain/plan'

/** Recipes the profile can eat, as the planner sees them (kcal per serving, ingredient texts for matching). */
export function toPlanRecipes(
  data: ReferenceData,
  diets: readonly Diet[],
  exclusions: readonly string[],
): PlanRecipe[] {
  const recipes: PlanRecipe[] = []
  for (const recipe of data.recipes.values()) {
    const ingredientTexts = recipe.ingredients.flatMap(({ foodId, label }) => [label, data.foods.get(foodId)!.name])
    if (!isRecipeAllowed({ tags: recipe.tags, ingredientTexts }, diets, exclusions)) continue
    recipes.push({
      id: recipe.id,
      slots: recipe.slots,
      kcal: recipe.nutrition.kcal,
      protein: recipe.protein,
      ingredientTexts,
    })
  }
  return recipes
}

/** Everyday foods offered as chips in "Ce que j'ai déjà". Only those found in an allowed recipe are shown. */
export const HAVE_SUGGESTIONS: ReadonlyArray<{ label: string; keyword: string }> = [
  { label: 'Poulet', keyword: 'poulet' },
  { label: 'Dinde', keyword: 'dinde' },
  { label: 'Bœuf', keyword: 'boeuf' },
  { label: 'Saumon', keyword: 'saumon' },
  { label: 'Thon', keyword: 'thon' },
  { label: 'Œufs', keyword: 'oeuf' },
  { label: 'Tofu', keyword: 'tofu' },
  { label: 'Lentilles', keyword: 'lentille' },
  { label: 'Pois chiches', keyword: 'pois chiche' },
  { label: 'Riz', keyword: 'riz' },
  { label: 'Pâtes', keyword: 'pate' },
  { label: 'Quinoa', keyword: 'quinoa' },
  { label: 'Pommes de terre', keyword: 'pomme de terre' },
  { label: 'Tomates', keyword: 'tomate' },
  { label: 'Courgettes', keyword: 'courgette' },
  { label: 'Carottes', keyword: 'carotte' },
  { label: 'Oignons', keyword: 'oignon' },
  { label: 'Poivrons', keyword: 'poivron' },
  { label: 'Brocoli', keyword: 'brocoli' },
  { label: 'Champignons', keyword: 'champignon' },
  { label: 'Avocat', keyword: 'avocat' },
  { label: 'Ail', keyword: 'ail' },
  { label: 'Lait', keyword: 'lait' },
  { label: 'Yaourt', keyword: 'yaourt' },
  { label: 'Fromage', keyword: 'fromage' },
  { label: 'Pain', keyword: 'pain' },
  { label: 'Flocons d’avoine', keyword: 'avoine' },
  { label: 'Bananes', keyword: 'banane' },
  { label: 'Pommes', keyword: 'pomme' },
]

/** The suggestions that would actually change the plan (found in at least one allowed recipe). */
export function availableSuggestions(recipes: readonly PlanRecipe[]) {
  return HAVE_SUGGESTIONS.filter(({ keyword }) => recipes.some((r) => matchesIngredient(r.ingredientTexts, keyword)))
}

/** Distinct ingredient labels of the allowed recipes, for the search field of "Ce que j'ai déjà". */
export function ingredientLabels(data: ReferenceData, recipes: readonly PlanRecipe[]): Array<{ key: string; label: string }> {
  const allowed = new Set(recipes.map((r) => r.id))
  const byKey = new Map<string, string>()
  for (const recipe of data.recipes.values()) {
    if (!allowed.has(recipe.id)) continue
    for (const { label } of recipe.ingredients) {
      const key = exclusionKey(label)
      if (!byKey.has(key)) byKey.set(key, label)
    }
  }
  return [...byKey.entries()].map(([key, label]) => ({ key, label }))
}
